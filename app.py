from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import requests
from dotenv import load_dotenv
import os
from datetime import timedelta
import csv
from openpyxl import Workbook, load_workbook
import openpyxl

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

app = Flask(__name__)
# Obtener la clave secreta desde la variable de entorno
app.secret_key = os.getenv('SECRET_KEY')

# Configurar el tiempo de expiración de la sesión a 30 minutos
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

EXCEL_PATH = r"\\10.2.0.7\Users\Sistemas\Documents\ordenes_trabajo.xlsx"


# URL de la API de usuarios
USERS_API_URL = 'http://10.2.0.7:8081/api/usuarios'

# Datos para la autenticación en SAP B1
SAP_LOGIN_URL = 'https://10.2.0.6:50000/b1s/v1/Login'
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
    
    # Consulta a la API de usuarios
    response = requests.get(USERS_API_URL)
    if response.status_code != 200:
        return jsonify({"message": "Error al consultar la API de usuarios"}), 500

    users = response.json()

    # Verificar las credenciales
    for user in users:
        if user['USUARIO'] == username:
            if user['ACTIVO'] == 0:
                return jsonify({"message": "Usuario inactivo, favor de checarlo con el departamento de sistemas de IPL"}), 403
            if user['PWD'] != password:
                return jsonify({"message": "Contraseña incorrecta"}), 403
            # Si el usuario está activo y la contraseña es correcta
            # Iniciar sesión en SAP B1
            sap_response = requests.post(SAP_LOGIN_URL, json={
                'CompanyDB': SAP_COMPANYDB,
                'UserName': SAP_USERNAME,
                'Password': SAP_PASSWORD
            }, verify=False)  # Desactivar la verificación SSL

            if sap_response.status_code == 200:
                # Leer cookies desde la respuesta
                sap_cookies = sap_response.cookies
                route_id = sap_cookies.get('ROUTEID')
                b1session = sap_cookies.get('B1SESSION')
                
                # Almacenar en la sesión de Flask
                session['ROUTEID'] = route_id
                session['B1SESSION'] = b1session
                session['is_admin'] = user['PERFIL'] == 1
                session['username'] = user['USUARIO']

                return jsonify({"message": "Login successful", "ROUTEID": route_id, "B1SESSION": b1session, "is_admin": session['is_admin']}), 200
            else:
                return jsonify({"message": "Error al iniciar sesión en SAP B1"}), 500
    return jsonify({"message": "Usuario no encontrado"}), 404

@app.route('/usuarios', methods=['GET'])
def usuarios():
    response = requests.get(USERS_API_URL)
    if response.status_code == 200:
        users = response.json()
        return render_template('usuarios.html', users=users)
    else:
        return jsonify({"message": "Error al consultar la API de usuarios"}), 500

@app.route('/menu')
def menu():
    is_admin = session.get('is_admin', False)
    return render_template('menu.html', is_admin=is_admin)

@app.route('/ordenes_trabajo')
def ordenes_trabajo():
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
        f"https://10.2.0.6:50000/b1s/v1/BusinessPartners?"
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
         "https://10.2.0.6:50000/b1s/v1/$crossjoin(Items, CustomerEquipmentCards, Manufacturers)"
        "?$expand=Items($select=ItemCode, U_Modelo, ForeignName),CustomerEquipmentCards($select=U_NoEconomico, ItemCode),Manufacturers($select=ManufacturerName)"
        f"&$filter=Items/ItemCode eq CustomerEquipmentCards/ItemCode and Items/Manufacturer eq Manufacturers/Code "
        f"and startswith(CustomerEquipmentCards/CustomerCode,'{customer_code}') and CustomerEquipmentCards/StatusOfSerialNumber eq 'A' "
        f"and (Items/ForeignName eq '{search_value}' or CustomerEquipmentCards/U_NoEconomico eq '{search_value}')"
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
        f"https://10.2.0.6:50000/b1s/v1/Items?$select=ItemCode,ItemName"
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
    

# Ruta para buscar empleados
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
        f"https://10.2.0.6:50000/b1s/v1/EmployeesInfo?"
        f"$select=FirstName,LastName,MiddleName,EmployeeID"
        f"&$filter=(JobTitle eq 'TECNICO') and (Active eq 'Y') and (startswith(LastName, '{query}') or startswith(FirstName, '{query}') or startswith(MiddleName, '{query}'))"
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
        f"https://10.2.0.6:50000/b1s/v1/EmployeesInfo?"
        f"$select=FirstName,LastName,MiddleName,EmployeeID"
        f"&$filter=Active eq 'Y' and JobTitle eq 'CSSR' "
        f"and (startswith(FirstName, '{query}') or startswith(LastName, '{query}') or startswith(MiddleName, '{query}'))"
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

    sap_url_base = "https://10.2.0.6:50000/b1s/v1/ServiceCallProblemTypes"
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
    
@app.route('/guardar_excel', methods=['POST'])
def guardar_excel():
    datos = request.json
    excel_path = "//10.2.0.7/Users/Sistemas/Documents/ordenes_trabajo.xlsx"

    # Definir las cabeceras personalizadas
    encabezados_1 = [
        "ServiceCallID", "subject", "CustomerCode", "callType", "ProblemType", "AssigneeCode",
        "CreationDate", "CreationTime", "TechnicianCode", "resolution", "Series", "StartDate",
        "StartTime", "EndDueDate", "EndTime", "CustomerRefNo", "ItemCode", "ManufacturerSerialNum",
        "U_Horometro", "U_HoraInicio", "U_HoraFin", "ProblemSubType", "U_PersonWhoReports",
        "U_Tecnico2", "U_Tecnico3", "U_Tecnico4", "U_CreateUser", "U_EquipoFunciona",
        "U_TipoRefacciones", "U_Qty1", "U_Code1", "U_Qty2", "U_Code2", "U_Qty3", "U_Code3",
        "U_Qty4", "U_Code4", "U_Qty5", "U_Code5", "U_Qty6", "U_Code6", "U_Qty7", "U_Code7",
        "U_Qty8", "U_Code8", "U_Qty9", "U_Code9", "U_Qty10", "U_Code10", "U_Qty11", "U_Code11",
        "U_Qty12", "U_Code12", "U_Version", "U_CSSR", "U_Qty13", "U_Code13", "U_Qty14",
        "U_Code14", "U_Qty15", "U_Code15", "U_Qty16", "U_Code16", "U_Qty17", "U_Code17",
        "U_Qty18", "U_Code18", "U_Qty19", "U_Code19", "U_Qty20", "U_Code20"
    ]
    encabezados_2 = [
        "Call ID", "Subject", "Business Partner Code", "Call Type", "Problem Type", "Handled By",
        "Creation Date", "Creation Time", "Technician", "Resolution", "Series", "Start Date",
        "Start Time", "End Date", "End Time", "Business Partner Ref. No.", "itemCode", "manufSN",
        "HOROMETRO", "U_HoraInicio", "U_HoraFin", "ProSubType", "U_PersonWhoReports", "U_Tecnico2",
        "U_Tecnico3", "U_Tecnico4", "U_CreateUser", "U_EquipoFunciona", "U_TipoRefacciones",
        "U_Qty1", "U_Code1", "U_Qty2", "U_Code2", "U_Qty3", "U_Code3", "U_Qty4", "U_Code4",
        "U_Qty5", "U_Code5", "U_Qty6", "U_Code6", "U_Qty7", "U_Code7", "U_Qty8", "U_Code8",
        "U_Qty9", "U_Code9", "U_Qty10", "U_Code10", "U_Qty11", "U_Code11", "U_Qty12", "U_Code12",
        "U_Version", "U_CSSR", "U_Qty13", "U_Code13", "U_Qty14", "U_Code14", "U_Qty15", "U_Code15",
        "U_Qty16", "U_Code16", "U_Qty17", "U_Code17", "U_Qty18", "U_Code18", "U_Qty19", "U_Code19",
        "U_Qty20", "U_Code20"
    ]

    # Verificar si el archivo existe
    archivo_existe = os.path.exists(excel_path)

    try:
        # Cargar el archivo o crear uno nuevo
        if archivo_existe:
            wb = load_workbook(excel_path)
            ws = wb.active
        else:
            wb = Workbook()
            ws = wb.active
            ws.append(encabezados_1)  # Primera fila
            ws.append(encabezados_2)  # Segunda fila

        # Extraer las refacciones
        refacciones = datos.pop("refacciones", [])
        refacciones_planas = []
        for i, ref in enumerate(refacciones, start=1):
            refacciones_planas.extend([
                ref.get("cantidad", ""),
                ref.get("numeroParte", ""),
            ])

        # Rellenar hasta 20 refacciones con espacios vacíos
        while len(refacciones_planas) < 40:
            refacciones_planas.append("")

        # Organizar los datos para las columnas
        fila_datos = [
            ws.max_row - 1,  # Columna 1: Número Consecutivo
            datos.get("descripcionFalla", ""),  # Columna 2: Descripción de la Falla
            datos.get("codigoCliente", ""),  # Columna 3: Código del Cliente
            datos.get("tipoOrden", ""),  # Columna 4: Tipo de Llamada
            datos.get("ProblemType", ""),  # Columna 5: Tipo de Problema
            "1",  # Columna 6: Fijo en 1
            datos.get("fechaInicio", "").replace("-", ""),  # Columna 7: Fecha de Creación
            datos.get("horaInicioTrabajo", "").replace(":", ""),  # Columna 8: Hora de Creación
            datos.get("realizoTrabajoEmployeeID", ""),  # Columna 9: EmployeeID
            datos.get("trabajoRealizado", ""),  # Columna 10: Trabajo Realizado
            datos.get("serie", ""),  # Columna 11: Serie
            datos.get("fechaInicio", "").replace("-", ""),  # Columna 12: Fecha de Inicio
            datos.get("horaInicioTrabajo", "").replace(":", ""),  # Columna 13: Hora de Inicio
            datos.get("fechaTermino", "").replace("-", ""),  # Columna 14: Fecha de Término
            datos.get("horaSalida", "").replace(":", ""),  # Columna 15: Hora de Término
            datos.get("folio", ""),  # Columna 16: Folio
            datos.get("itemCode", ""),  # Columna 17: Número Económico
            datos.get("noSerie", ""),  # Columna 18: Número de Serie
            datos.get("horometro", ""),  # Columna 19: Horómetro
            datos.get("horaInicioTrabajo", "").replace(":", ""),  # Columna 20: Hora de Inicio
            datos.get("horaSalida", "").replace(":", ""),  # Columna 21: Hora de Fin
            datos.get("ProSubType", ""),  # Columna 22: Subtipo de Falla
            datos.get("personaReporta", ""),  # Columna 23: Persona que Reporta
            datos.get("revisoTrabajo", ""),  # Columna 24: Persona que Revisó
            "",  # Columna 25: Vacío
            "",  # Columna 26: Vacío
            datos.get("usuarioCreacion", ""),  # Columna 27: Usuario Creación
            datos.get("equipoFuncionamiento", ""),  # Columna 28: Equipo en Funcionamiento
            "0" if datos.get("tipoRefacciones") == "Requeridas" else "1" if datos.get("tipoRefacciones") == "Instaladas" else "2",  # Columna 29
            # Columnas adicionales
        ] + [""] * (65 - len(refacciones_planas)) + [datos.get("nombreCssr", "")] + refacciones_planas  # Columna 55: Nombre CSSR

        # Agregar la fila de datos al Excel
        ws.append(fila_datos)

        # Guardar el archivo
        wb.save(excel_path)

        return jsonify({"message": "Datos guardados correctamente en Excel."}), 200
    except Exception as e:
        return jsonify({"message": "Error al guardar en Excel.", "error": str(e)}), 500


@app.route('/logout')
def logout():
    session.pop('ROUTEID', None)
    session.pop('B1SESSION', None)
    session.pop('is_admin', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
