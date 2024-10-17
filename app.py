from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import requests
from dotenv import load_dotenv
import os
from datetime import timedelta

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

app = Flask(__name__)
# Obtener la clave secreta desde la variable de entorno
app.secret_key = os.getenv('SECRET_KEY')

# Configurar el tiempo de expiración de la sesión a 30 minutos
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# URL de la API de usuarios
USERS_API_URL = 'http://52.153.228.209:8081/api/usuarios'

# Datos para la autenticación en SAP B1
SAP_LOGIN_URL = 'https://52.152.107.200:50000/b1s/v1/Login'
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

@app.route('/logout')
def logout():
    session.pop('ROUTEID', None)
    session.pop('B1SESSION', None)
    session.pop('is_admin', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
