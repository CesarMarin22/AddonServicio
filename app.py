from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import requests
from dotenv import load_dotenv
import os
from datetime import timedelta
import csv
from openpyxl import Workbook, load_workbook
import openpyxl
from datetime import datetime

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

app = Flask(__name__)
# Obtener la clave secreta desde la variable de entorno
app.secret_key = os.getenv('SECRET_KEY')

# Configurar el tiempo de expiración de la sesión a 30 minutos
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

EXCEL_PATH = r"\\10.1.0.4\Users\Sistemas\Documents\ordenes_trabajo.xlsx"


# URL de la API de usuarios
USERS_API_URL = 'http://158.23.90.252:8081/api/usuarios'

# Datos para la autenticación en SAP B1
SAP_LOGIN_URL = 'https://158.23.90.252:50000/b1s/v1/Login'
SAP_USERNAME = 'manager'
SAP_PASSWORD = 'yottak01'
SAP_COMPANYDB = 'B1_IPL'

# Evitar que el navegador almacene en caché para prevenir el acceso a sesiones cerradas
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.before_request
def ensure_session_is_active():
    session.permanent = True  # Asegura que el tiempo de vida de la sesión sea respetado
    # Asegurarse de que no estamos en las rutas de login o static
    if 'B1SESSION' not in session and request.endpoint not in ['login', 'index', 'static']:
        return redirect(url_for('index'))

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    response = requests.get(USERS_API_URL)
    if response.status_code != 200:
        return jsonify({"status": "error", "message": "Error al consultar la API de usuarios"}), 200

    users = response.json()

    for user in users:
        if user['USUARIO'] == username:
            if user['ACTIVO'] == 0:
                return jsonify({"status": "warning", "message": "Usuario inactivo, favor de checarlo con el departamento de sistemas de IPL"}), 403
            if user['PWD'] != password:
                return jsonify({"status": "error", "message": "Contraseña incorrecta"}), 401

            # Si el usuario está activo y la contraseña es correcta
            sap_response = requests.post(SAP_LOGIN_URL, json={
                'CompanyDB': SAP_COMPANYDB,
                'UserName': SAP_USERNAME,
                'Password': SAP_PASSWORD
            }, verify=False)

            if sap_response.status_code == 200:
                sap_cookies = sap_response.cookies
                route_id = sap_cookies.get('ROUTEID')
                b1session = sap_cookies.get('B1SESSION')
                
                session['ROUTEID'] = route_id
                session['B1SESSION'] = b1session
                session['is_admin'] = user['PERFIL'] == 1
                session['perfil'] = user['PERFIL']
                session['username'] = user['USUARIO']
                session['sucursal'] = user['SUCURSAL']
                


                return jsonify({
                    "status": "success",
                    "message": "Login successful",
                    "ROUTEID": route_id,
                    "B1SESSION": b1session,
                    "is_admin": session['is_admin']
                }), 200
            else:
                return jsonify({"status": "error", "message": "Error al iniciar sesión en SAP B1"}), 401

    return jsonify({"status": "error", "message": "Usuario no encontrado"}), 401

@app.route('/usuarios', methods=['GET'])
def usuarios():
    response = requests.get(USERS_API_URL)
    if response.status_code == 200:
        users = response.json()
        return render_template('usuarios.html', users=users)
    else:
        return jsonify({"message": "Error al consultar la API de usuarios"}), 500


@app.route('/ordenes_trabajo')
def ordenes_trabajo():
    sucursal=session.get('sucursal')
    return render_template('ordenes_trabajo.html')

@app.route('/buscar_clientes', methods=['GET'])
def buscar_clientes():
    # Obtener el parámetro de búsqueda
    search_query = request.args.get('query', '')

    if not search_query:
        return jsonify({"message": "No search query provided"}), 400

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    # Modificar la URL para buscar por CardCode, CardName o CardForeignName, y CardType cCustomer
    sap_url = (
        f"https://158.23.90.252:50000/b1s/v1/BusinessPartners?"
        f"$filter=(contains(CardCode, '{search_query}') "
        f"or contains(CardName, '{search_query}') "
        f"or contains(CardForeignName, '{search_query}')) "
        f"and CardType eq 'cCustomer'"
    )
    
    try:
        response = requests.get(sap_url, headers={
            'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
            'Content-Type': 'application/json'
        }, verify=False)  # Ignorar la verificación del SSL

        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500
    
################################################################################################################################################
@app.route('/equipos_cliente', methods=['GET'])
def equipos_cliente():
    customer_code = request.args.get('customer_code', '')
    search_value = request.args.get('search_value', '')

    if not customer_code:
        return jsonify({"message": "No customer code provided"}), 400

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    # Construye la consulta para obtener todos los equipos activos del cliente
    sap_url = (
    "https://158.23.90.252:50000/b1s/v1/$crossjoin(Items, CustomerEquipmentCards, Manufacturers)"
    "?$expand=Items($select=ItemCode, U_Modelo),CustomerEquipmentCards($select=U_NoEconomico, ItemCode, ManufacturerSerialNum),Manufacturers($select=ManufacturerName)"
    f"&$filter=Items/ItemCode eq CustomerEquipmentCards/ItemCode and Items/Manufacturer eq Manufacturers/Code "
    f"and contains(CustomerEquipmentCards/CustomerCode,'{customer_code}') and CustomerEquipmentCards/StatusOfSerialNumber eq 'A' "
    f"and (contains(CustomerEquipmentCards/ManufacturerSerialNum,'{search_value}') or contains(CustomerEquipmentCards/U_NoEconomico,'{search_value}'))"
)

    try:
        response = requests.get(sap_url, headers={
            'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
            'Content-Type': 'application/json'
        }, verify=False)  # Ignorar la verificación del SSL

        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500

#############################################################################################################################################################################
@app.route('/items', methods=['GET'])
def buscar_items():
    item_code = request.args.get('query', '')
    group_code = request.args.get('groupCode', '')

    if not item_code:
        return jsonify({"message": "No item code provided"}), 400

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    # Construir la consulta para obtener los items
    sap_url = (
        f"https://158.23.90.252:50000/b1s/v1/Items?$select=ItemCode,ItemName"
        f"&$filter=startswith(ItemCode, '{item_code}') and ItemsGroupCode eq {group_code}"
    )

    try:
        response = requests.get(sap_url, headers={
            'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
            'Content-Type': 'application/json'
        }, verify=False)  # Ignorar la verificación del SSL

        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500
    

################################################################################################################################################################################
@app.route('/buscar_empleados', methods=['GET'])
def buscar_empleados():
    query = request.args.get('query', '')

    if not query:
        return jsonify({"message": "No query provided"}), 400

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    # Construir la consulta para obtener los empleados
    sap_url = (
        f"https://158.23.90.252:50000/b1s/v1/EmployeesInfo?"
    f"$select=FirstName,LastName,MiddleName,EmployeeID,Active, EmployeeRolesInfoLines"
    f"&$filter=(JobTitle eq 'TECNICO' ) and (Active eq 'tYES') "
    f"and (contains(LastName, '{query}') or contains(FirstName, '{query}') or contains(MiddleName, '{query}'))"
    )

    try:
        response = requests.get(sap_url, headers={
            'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
            'Content-Type': 'application/json'
        }, verify=False)  # Ignorar la verificación del SSL

        if response.status_code == 200:
            empleados = response.json().get("value", [])

            # Formatear los nombres completos
            for empleado in empleados:
                empleado["FullName"] = " ".join(
                    part for part in [empleado.get("LastName"), empleado.get("FirstName"), empleado.get("MiddleName")] if part
                )
                roles = empleado.get("EmployeeRolesInfoLines", [])
                empleado["RoleID"] = roles[0]["RoleID"] if roles else None

            return jsonify({"value": empleados}), 200
        else:
            return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500

################################################################################################################################################   
@app.route('/buscar_cssrs', methods=['GET'])
def buscar_cssrs():
    query = request.args.get('query', '')

    if not query:
        return jsonify({"message": "No query provided"}), 400

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    # Construir la consulta para obtener los CSSRs activos
    sap_url = (
        f"https://158.23.90.252:50000/b1s/v1/EmployeesInfo?"
        f"$select=FirstName,LastName,MiddleName,EmployeeID"
        f"&$filter=Active eq 'Y' and JobTitle eq 'CSSR' "
        f"and (contains(FirstName, '{query}') or contains(LastName, '{query}') or contains(MiddleName, '{query}'))"
    )

    try:
        response = requests.get(sap_url, headers={
            'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
            'Content-Type': 'application/json'
        }, verify=False)  # Ignorar la verificación SSL

        if response.status_code == 200:
            cssrs = response.json().get("value", [])

            # Formatear los nombres completos
            for cssr in cssrs:
                cssr["FullName"] = " ".join(
                    part for part in [cssr.get("LastName"), cssr.get("FirstName"), cssr.get("MiddleName")] if part
                )

            return jsonify({"value": cssrs}), 200
        else:
            return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500

###################################################################################################################################################
    
@app.route('/tipos_problema', methods=['GET'])
def tipos_problema():
    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    sap_url_base = "https://158.23.90.252:50000/b1s/v1/ServiceCallProblemTypes"
    headers = {
        'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
        'Content-Type': 'application/json'
    }

    try:
        all_tipos_problema = []
        skip = 0
        top = 20  # Cantidad máxima por página

        while True:
            # Construir la URL con el filtro y los parámetros de paginación
            sap_url = (
                f"{sap_url_base}?"
                f"$filter=Active eq 'Y'&$orderby=Name asc&$skip={skip}&$top={top}"
            )
            response = requests.get(sap_url, headers=headers, verify=False)  # Ignorar verificación SSL

            if response.status_code != 200:
                return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code

            # Parsear los datos de la respuesta
            data = response.json().get("value", [])
            all_tipos_problema.extend(data)

            # Si la cantidad de datos obtenidos es menor al máximo, terminamos
            if len(data) < top:
                break

            # Incrementar el valor de `skip` para obtener la siguiente página
            skip += top

        # Devolver todos los datos acumulados
        return jsonify({"value": all_tipos_problema}), 200
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500


#######################################################################################################################################################
    
@app.route('/guardar_csv', methods=['POST'])
def guardar_csv():
    datos = request.get_json() or request.form.to_dict() 
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tipo = datos.get("data-tipo", "") or datos.get("tipo", "")
    if tipo == "seguridad":
        prefix = "flash_report"
    elif tipo == "audi":
        prefix = "audi_ot"
    else:
        prefix = "ordenes_trabajo"

    csv_path = f"C:\\Publish\\addonServicioweb\\{prefix}_{timestamp}.csv"

     # Definir los encabezados personalizados
    encabezados_1 = [
        "ServiceCallID", "subject", "CustomerCode", "callType", "ProblemType", "AssigneeCode",
        "CreationDate", "CreationTime", "TechnicianCode", "resolution", "Series", "StartDate",
        "StartTime", "EndDueDate", "EndTime", "CustomerRefNo", "ItemCode", "ManufacturerSerialNum",
        "U_Horometro", "U_HoraInicio", "U_HoraFin", "ProblemSubType", "U_PersonWhoReports",
        "U_Tecnico2", "U_Tecnico3", "U_Tecnico4", "U_CreateUser", "U_EquipoFunciona",
        "U_TipoRefacciones", "U_Qty1", "U_Code1", "U_Qty2", "U_Code2", "U_Qty3", "U_Code3",
        "U_Qty4", "U_Code4", "U_Qty5", "U_Code5", "U_Qty6", "U_Code6", "U_Qty7", "U_Code7",
        "U_Qty8", "U_Code8", "U_Qty9", "U_Code9", "U_Qty10", "U_Code10", "U_Qty11", "U_Code11",
        "U_Qty12", "U_Code12", "U_Qty13", "U_Code13", "U_Qty14", "U_Code14", "U_Qty15", "U_Code15",
        "U_Qty16", "U_Code16", "U_Qty17", "U_Code17", "U_Qty18", "U_Code18", "U_Qty19", "U_Code19",
        "U_Qty20", "U_Code20", "U_Version", "U_CSSR", "U_Severidad", "U_AreaTrabajo", "U_AccionesR",
        "U_Plan", "U_Leccion", "U_Costo", "U_A_FolioE", "U_A_Orden", "U_A_NumTec", "U_A_Horas", "U_VoBoT"
    ]

    encabezados_2 = [
        "Call ID", "Subject", "Business Partner Code", "Call Type", "Problem Type", "Handled By",
        "Creation Date", "Creation Time", "Technician", "Resolution", "Series", "Start Date",
        "Start Time", "End Date", "End Time", "Business Partner Ref. No.", "itemCode", "manufSN",
        "U_Horometro", "U_HoraInicio", "U_HoraFin", "ProSubType", "U_PersonWhoReports", "U_Tecnico2",
        "U_Tecnico3", "U_Tecnico4", "U_CreateUser", "U_EquipoFunciona", "U_TipoRefacciones",
        "U_Qty1", "U_Code1", "U_Qty2", "U_Code2", "U_Qty3", "U_Code3", "U_Qty4", "U_Code4",
        "U_Qty5", "U_Code5", "U_Qty6", "U_Code6", "U_Qty7", "U_Code7", "U_Qty8", "U_Code8",
        "U_Qty9", "U_Code9", "U_Qty10", "U_Code10", "U_Qty11", "U_Code11", "U_Qty12", "U_Code12",
        "U_Qty13", "U_Code13", "U_Qty14", "U_Code14", "U_Qty15", "U_Code15",
        "U_Qty16", "U_Code16", "U_Qty17", "U_Code17", "U_Qty18", "U_Code18", "U_Qty19", "U_Code19",
        "U_Qty20", "U_Code20", "U_Version", "U_CSSR", "U_Severidad", "U_AreaTrabajo", "U_AccionesR", 
        "U_Plan", "U_Leccion", "U_Costo", "U_A_FolioE", "U_A_Orden", "U_A_NumTec", "U_A_Horas", "U_VoBoT"
    ]

    try:
        # Crear el archivo CSV y escribir encabezados
        with open(csv_path, mode='w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(encabezados_1)  # Escribir encabezados 1
            writer.writerow(encabezados_2)  # Escribir encabezados 2
            # Extraer las refacciones
            refacciones = datos.pop("refacciones", [])
            tipo_refacciones = datos.get("tipoRefacciones", "1")  # Default: Instaladas
            refacciones_planas = []
            for i in range(20):
                if i < len(refacciones):
                    ref = refacciones[i]
                    refacciones_planas.append(ref.get("cantidad", ""))
                    refacciones_planas.append(ref.get("numeroParte", ""))
                else:
                    refacciones_planas.append("")
                    refacciones_planas.append("")

            if tipo_refacciones == "0":  # Requeridas
                refacciones_instaladas = [""] * 20  # Vaciar U_Qty1 a U_Qty10
                refacciones_requeridas = refacciones_planas[:20]  # U_Qty11 a U_Code20
            elif tipo_refacciones == "1":  # Instaladas
                refacciones_instaladas = refacciones_planas[:20]
                refacciones_requeridas = [""] * 20  # U_Qty11 a U_Qty20
            else:  # Ambas
                refacciones_instaladas = refacciones_planas[:20]  # U_Qty1 a U_Qty10
                refacciones_requeridas = refacciones_planas[20:]  # U_Qty11 a U_Qty20

            # Organizar los datos para las columnas
            fila_datos = [
                1,  # Columna 1: Número Consecutivo
                datos.get("descripcionFalla", ""),
                datos.get("codigoCliente", ""),
                datos.get("tipoOrden", ""),
                datos.get("ProblemType", ""),
                "1",
                datos.get("fechaInicio", "").replace("/", ""),
                datos.get("horaInicioTrabajo", "").replace(":", ""),
                datos.get("realizoTrabajoEmployeeID", ""),
                datos.get("trabajoRealizado", ""),
                datos.get("serie", ""),
                datos.get("fechaInicio", "").replace("/", ""),
                datos.get("horaInicioTrabajo", "").replace(":", ""),
                datos.get("fechaTermino", "").replace("/", ""),
                datos.get("horaSalida", "").replace(":", ""),
                datos.get("folio", ""),
                datos.get("itemCode", ""),
                datos.get("noSerie", ""),
                datos.get("horometro", ""),
                datos.get("horaInicioTrabajo", "").replace(":", ""),
                datos.get("horaSalida", "").replace(":", ""),
                datos.get("ProSubType", ""),
                datos.get("personaReporta", ""),
                datos.get("revisoTrabajo", ""),
                datos.get("tecnico3", ""),
                datos.get("tecnico4", ""),
                datos.get("usuarioCreacion", ""),
                datos.get("equipoFuncionamiento", ""),
                tipo_refacciones,
            ] + refacciones_instaladas + refacciones_requeridas + [
                "1",  # U_Version (siempre 1)
                datos.get("nombreCssr", ""),
                datos.get("U_Severidad", ""),
                datos.get("areaTrabajo", ""),
                datos.get("accionesSituacion", ""),
                datos.get("planAccion", ""),
                datos.get("leccionesAprendidas", ""),
                datos.get("costoAproximado", ""),
                datos.get("folioEx", ""),
                datos.get("tipoOrdenAudi", ""),
                datos.get("NumPersonas", ""),
                datos.get("horasTrabajadas", ""),
                datos.get("vistoBuenoCliente", "")
            ]

            # Escribir los datos en el archivo CSV
            writer.writerow(fila_datos)

        return jsonify({"message": "Datos guardados correctamente en CSV."}), 200

    except Exception as e:
        return jsonify({"message": "Error al guardar en CSV.", "error": str(e)}), 500


@app.route('/menu')
def menu():
    username = session.get('username')
    is_admin = session.get('is_admin', False)

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    sap_url = f"https://158.23.90.252:50000/b1s/v1/ServiceCalls?$filter=U_CreateUser eq '{username}'&$orderby=AssignedDate desc&$top=10&$select=DocNum,CustomerRefNo,CustomerName,ManufacturerSerialNum,AssignedDate"

    headers = {
        'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
        'Content-Type': 'application/json'
    }

    llamadas = []
    try:
        response = requests.get(sap_url, headers=headers, verify=False)
        if response.status_code == 200:
            llamadas_raw = response.json().get("value", [])
            for llamada in llamadas_raw:
                fecha_iso = llamada.get("AssignedDate", "")
                try:
                    fecha_obj = datetime.strptime(fecha_iso, "%Y-%m-%dT%H:%M:%SZ")
                    llamada["FechaFormateada"] = fecha_obj.strftime("%d/%m/%Y")
                except:
                    llamada["FechaFormateada"] = fecha_iso  # fallback por si algo sale mal
                llamadas.append(llamada)
    except Exception as e:
        print("Error al obtener llamadas:", e)

    return render_template("menu.html", llamadas=llamadas, is_admin=is_admin, perfil=session.get('perfil'))


@app.route('/ot_seguridad')
def ot_seguridad():
    if session.get('perfil') in [1,4]:  # Solo personal de seguridad puede entrar
        return render_template('ot_seguridad.html')
    else:
        return redirect(url_for('menu'))  # Redirigir si no tiene permiso

@app.route('/ot_audi')
def ot_audi():
    return render_template('ot_audi.html')

    
@app.route('/buscar_empleados_todos', methods=['GET'])
def buscar_empleados_todos():
    query = request.args.get('query', '')

    if not query:
        return jsonify({"message": "No query provided"}), 400

    route_id = session.get('ROUTEID')
    b1session = session.get('B1SESSION')

    if not route_id or not b1session:
        return jsonify({"message": "No active session"}), 403

    # Mismo select, pero SIN filtro de JobTitle (solo activos)
    sap_url = (
        f"https://158.23.90.252:50000/b1s/v1/EmployeesInfo?"
        f"$select=FirstName,LastName,MiddleName,EmployeeID,Active,EmployeeRolesInfoLines"
        f"&$filter=(Active eq 'tYES') and "
        f"(contains(LastName, '{query}') or contains(FirstName, '{query}') or contains(MiddleName, '{query}'))"
    )

    try:
        response = requests.get(sap_url, headers={
            'Cookie': f'B1SESSION={b1session}; ROUTEID={route_id}',
            'Content-Type': 'application/json'
        }, verify=False)

        if response.status_code == 200:
            empleados = response.json().get("value", [])

            # Formateo de nombre y RoleID igual que el otro endpoint
            for empleado in empleados:
                empleado["FullName"] = " ".join(
                    part for part in [empleado.get("LastName"), empleado.get("FirstName"), empleado.get("MiddleName")] if part
                )
                roles = empleado.get("EmployeeRolesInfoLines", [])
                empleado["RoleID"] = roles[0]["RoleID"] if roles else None

            return jsonify({"value": empleados}), 200
        else:
            return jsonify({"message": "Error al consultar SAP B1", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"message": "Error en la solicitud", "error": str(e)}), 500


@app.route('/logout')
def logout():
    session.pop('ROUTEID', None)
    session.pop('B1SESSION', None)
    session.pop('is_admin', None)
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
