////////////////////////////la que estaba
// Función para cerrar sesión
window.logout = function () {
  axios
    .get("/logout")
    .then(function () {
      window.location.href = "/";
    })
    .catch(function (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.fire({
        icon: "error", // Icono de error
        title: "Error",
        text: "Hubo un problema al cerrar la sesión. Inténtalo de nuevo.", // Mensaje
        toast: true, // Indica que es un toast
        position: "top-end", // Posición del toast
        showConfirmButton: false, // No muestra botón de confirmación
        timer: 3000, // Tiempo en milisegundos que se muestra el mensaje (3 segundos)
        timerProgressBar: true, // Añade una barra de progreso visual
      });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let debounceTimeout; // Variable para almacenar el temporizador de debounce

// Función para buscar clientes
function buscarClientes() {
  const input = document.getElementById("codigoCliente").value.toUpperCase();
  const dropdown = document.getElementById("dropdownClientes");

  // Limpiar el temporizador previo
  clearTimeout(debounceTimeout);

  // Si el input está vacío, ocultamos el dropdown, borramos el nombre del cliente y terminamos la función
  if (input.length === 0) {
    dropdown.style.display = "none";
    document.getElementById("nombreCliente").value = ""; // Borrar el nombre del cliente
    console.log("Campo 'codigoCliente' vacío: se detiene la consulta."); // Mensaje de depuración
    return;
  }

  // Establecemos el temporizador de debounce
  debounceTimeout = setTimeout(() => {
    // Hacer la solicitud al backend Flask después del tiempo de debounce
    axios
      .get(`/buscar_clientes?query=${input}`)
      .then(function (response) {
        const clientes = response.data.value;
        dropdown.innerHTML = ""; // Limpiar los resultados anteriores

        if (clientes.length > 0) {
          clientes.forEach(function (cliente) {
            const item = document.createElement("a");
            item.className = "dropdown-item";
            item.href = "#";
            item.innerText = `${cliente.CardCode} - ${cliente.CardName} (${cliente.CardForeignName})`;
            item.onclick = function () {
              document.getElementById("codigoCliente").value = cliente.CardCode;
              document.getElementById("nombreCliente").value = cliente.CardName;
              dropdown.style.display = "none";
            };
            dropdown.appendChild(item);
          });
          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      })
      .catch(function (error) {
        console.error("Error al consultar los clientes:", error);
        dropdown.style.display = "none";
      });
  }, 500); // 500 ms de debounce
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let debounceTimeoutItems = {}; // Variable para almacenar temporizadores de debounce para cada fila
// funcion para buscar los items
function buscarItemConDebounce(inputElement, rowIndex) {
  const searchValue = inputElement.value.toUpperCase();
  const dropdown = document.getElementById(`dropdownItems${rowIndex}`);

  // Limpiar el temporizador de debounce previo para la fila específica
  clearTimeout(debounceTimeoutItems[rowIndex]);

  // Si el campo "ItemCode" está vacío, ocultar el dropdown y salir
  if (searchValue.length === 0) {
    dropdown.style.display = "none";
    limpiarDescripcion(rowIndex); // Limpiar la descripción si el campo está vacío
    return;
  }

  // Establecer el temporizador de debounce para cada fila de manera independiente
  debounceTimeoutItems[rowIndex] = setTimeout(() => {
    // Hacer la solicitud al backend después del tiempo de debounce
    axios
      .get(`/items?query=${searchValue}&groupCode=538`)
      .then(function (response) {
        const items = response.data.value;
        dropdown.innerHTML = ""; // Limpiar resultados previos

        if (items.length > 0) {
          items.forEach(function (item) {
            const itemElement = document.createElement("a");
            itemElement.className = "dropdown-item";
            itemElement.href = "#";
            itemElement.innerText = `${item.ItemCode} - ${item.ItemName}`;
            itemElement.onclick = function () {
              inputElement.value = item.ItemCode;
              document.querySelectorAll(".item-name")[rowIndex].value =
                item.ItemName;
              dropdown.style.display = "none";
            };
            dropdown.appendChild(itemElement);
          });
          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      })
      .catch(function (error) {
        console.error("Error al consultar los items:", error);
        dropdown.style.display = "none";
      });
  }, 500); // 500 ms de debounce
}

// Función para limpiar la descripción cuando se borra el "ItemCode"
function limpiarDescripcion(rowIndex) {
  document.querySelectorAll(".item-name")[rowIndex].value = "";
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let debounceTimeoutCssrs = {}; // Variable para almacenar temporizadores de debounce
//funcion para buscar CSSRs
function buscarCssrsConDebounce(inputId) {
  const searchValue = document.getElementById(inputId).value.toUpperCase();
  const dropdown = document.getElementById(
    `dropdown${capitalizeFirstLetter(inputId)}`
  );

  // Limpiar el temporizador previo para el campo específico
  clearTimeout(debounceTimeoutCssrs[inputId]);

  // Si el campo está vacío, ocultar el dropdown y salir
  if (searchValue.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  // Establecer el temporizador de debounce
  debounceTimeoutCssrs[inputId] = setTimeout(() => {
    // Realizar la solicitud al backend Flask
    axios
      .get(`/buscar_cssrs?query=${searchValue}`)
      .then(function (response) {
        const cssrs = response.data.value;
        dropdown.innerHTML = ""; // Limpiar resultados previos

        // Si hay CSSRs, mostrar el dropdown con las opciones
        if (cssrs.length > 0) {
          cssrs.forEach((cssr) => {
            const item = document.createElement("a");
            item.className = "dropdown-item";
            item.href = "#";
            item.innerText = `${cssr.FullName} (${cssr.EmployeeID})`; // Mostrar el nombre completo
            item.onclick = function () {
              document.getElementById(inputId).value = cssr.FullName; // Colocar el nombre completo en el input
              document.getElementById(`${inputId}EmployeeID`).value =
                cssr.EmployeeID; // Colocar el EmployeeID en un input oculto
              dropdown.style.display = "none";
            };
            dropdown.appendChild(item);
          });
          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      })
      .catch(function (error) {
        console.error("Error al consultar los CSSRs:", error);
        dropdown.style.display = "none";
      });
  }, 500); // 500 ms de debounce
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let debounceTimeoutEquipos; // Variable para el temporizador de debounce
let equiposCliente = []; // Variable global para almacenar los equipos activos del cliente

// Función para buscar equipos en el backend con debounce
function buscarEquiposConDebounce() {
  const searchValue = document.getElementById("noSerie").value.toUpperCase();
  const customerCode = document
    .getElementById("codigoCliente")
    .value.toUpperCase();
  const dropdown = document.getElementById("dropdownEquipos");

  // Limpiar el temporizador previo
  clearTimeout(debounceTimeoutEquipos);

  // Si el input está vacío, ocultamos el dropdown y terminamos la función
  if (searchValue.length === 0) {
    limpiarCamposDependientes(); // Llama a la función para limpiar los campos dependientes
    dropdown.style.display = "none";
    return;
  }

  // Establecemos el temporizador de debounce
  debounceTimeoutEquipos = setTimeout(() => {
    // Hacer la solicitud al backend Flask después del tiempo de debounce
    axios
      .get(
        `/equipos_cliente?customer_code=${customerCode}&search_value=${searchValue}`
      )
      .then(function (response) {
        equiposCliente = response.data.value; // Guardamos los equipos obtenidos
        mostrarEquipos(equiposCliente); // Muestra todos los equipos obtenidos en el dropdown
      })
      .catch(function (error) {
        console.error("Error al cargar los equipos del cliente:", error);
      });
  }, 500); // 500 ms de debounce
}

///LIMPIAR CAMPOS
function limpiarCamposDependientes() {
  document.getElementById("marca").value = ""; // Limpiar el campo "Marca"
  document.getElementById("modelo").value = ""; // Limpiar el campo "Modelo"
  document.getElementById("noEconomico").value = ""; // Limpiar el campo "Número Económico"
  document.getElementById("itemCode").value = "";
}

function seleccionarEquipo(equipo) {
  document.getElementById("marca").value =
    equipo.Manufacturers.ManufacturerName; // Marca
  document.getElementById("modelo").value = equipo.Items.U_Modelo; // Modelo
  document.getElementById("noEconomico").value =
    equipo.CustomerEquipmentCards.U_NoEconomico; // Número Económico
  document.getElementById("itemCode").value =
    equipo.CustomerEquipmentCards.ItemCode; // ItemCode (campo oculto)
}

// Función para mostrar los equipos en el dropdown
function mostrarEquipos(equipos) {
  const dropdown = document.getElementById("dropdownEquipos");
  dropdown.innerHTML = ""; // Limpiar los resultados anteriores

  equipos.forEach(function (equipo) {
    const item = document.createElement("a");
    item.className = "dropdown-item";
    item.href = "#";
    item.innerText = `${equipo.CustomerEquipmentCards.ManufacturerSerialNum} - ${equipo.Items.U_Modelo} - ${equipo.CustomerEquipmentCards.U_NoEconomico}`;
    item.onclick = function () {
      seleccionarEquipo(equipo); // Llenar los campos al seleccionar un equipo
      dropdown.style.display = "none"; // Ocultar el dropdown
    };
    dropdown.appendChild(item);
  });

  dropdown.style.display = equipos.length > 0 ? "block" : "none"; // Mostrar el dropdown si hay equipos
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Función para llenar los campos con el equipo seleccionado
function seleccionarEquipo(equipo) {
  document.getElementById("marca").value =
    equipo.Manufacturers.ManufacturerName;
  document.getElementById("modelo").value = equipo.Items.U_Modelo;
  document.getElementById("noEconomico").value =
    equipo.CustomerEquipmentCards.U_NoEconomico;
  document.getElementById("noSerie").value =
    equipo.CustomerEquipmentCards.ManufacturerSerialNum;
  document.getElementById("itemCode").value =
    equipo.CustomerEquipmentCards.ItemCode;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Función para habilitar/deshabilitar los campos de refacciones según la selección
function habilitarRefacciones() {
  const instaladasCheckbox = document.getElementById("refaccionesInstaladas");
  const requeridasCheckbox = document.getElementById("refaccionesRequeridas");
  const ambasCheckbox = document.getElementById("refaccionesAmbas");
  const refaccionesTitulo = document.getElementById("refaccionesTitulo");
  const refacciones = document.querySelectorAll(
    "#refaccionesContainer .form-group"
  );

  // Deshabilitar todos los campos de refacciones inicialmente
  refacciones.forEach((refaccion) => {
    refaccion.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
    });
  });

  // Si "Instaladas" está seleccionado, habilitar los primeros 10 campos
  if (instaladasCheckbox.checked) {
    refaccionesTitulo.innerText = "Refacciones Instaladas";
    for (let i = 0; i < 10; i++) {
      refacciones[i].querySelectorAll("input").forEach((input) => {
        input.disabled = false;
      });
    }
  }

  // Si "Requeridas" está seleccionado, habilitar los últimos 10 campos
  if (requeridasCheckbox.checked) {
    refaccionesTitulo.innerText = "Refacciones Requeridas";
    for (let i = 10; i < 20; i++) {
      refacciones[i].querySelectorAll("input").forEach((input) => {
        input.disabled = false;
      });
    }
  }

  // Si "Ambas" está seleccionado, habilitar todos los 20 campos
  if (ambasCheckbox.checked) {
    refaccionesTitulo.innerText = "Refacciones Instaladas y Requeridas";
    refacciones.forEach((refaccion) => {
      refaccion.querySelectorAll("input").forEach((input) => {
        input.disabled = false;
      });
    });
  }
}

document
  .querySelectorAll('input[name="tipoRefacciones"]')
  .forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        document
          .querySelectorAll('input[name="tipoRefacciones"]')
          .forEach((cb) => {
            if (cb !== this) cb.checked = false;
          });
      }
      habilitarRefacciones(); // Llamar a habilitarRefacciones para actualizar los campos según la selección
    });
  });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let debounceTimeoutEmpleados = {}; // Variable para almacenar temporizadores de debounce por campo

// Función de búsqueda de empleados con debounce
function buscarEmpleadoConDebounce(inputId) {
  const searchValue = document
    .getElementById(inputId)
    .value.trim()
    .toUpperCase();
  const dropdownId = `dropdown${capitalizeFirstLetter(inputId)}`;
  const dropdown = document.getElementById(dropdownId);

  clearTimeout(debounceTimeoutEmpleados[inputId]);

  if (searchValue.length === 0) {
    dropdown.style.display = "none";
    dropdown.innerHTML = "";
    return;
  }

  // ✅ Detectar si el form tiene data-tipo="seguridad"
  const isSeguridad =
    document.querySelector("#ordenTrabajoForm[data-tipo='seguridad']") !== null;

  const endpoint = isSeguridad
    ? `/buscar_empleados_todos?query=${searchValue}`
    : `/buscar_empleados?query=${searchValue}`;

  debounceTimeoutEmpleados[inputId] = setTimeout(() => {
    axios
      .get(endpoint)
      .then(function (response) {
        const empleados = response.data.value || [];
        dropdown.innerHTML = "";

        if (empleados.length > 0) {
          empleados.forEach((empleado) => {
            const item = document.createElement("a");
            item.className = "dropdown-item";
            item.href = "#";
            item.innerText = `${empleado.FullName} (${empleado.EmployeeID})`;

            item.addEventListener("click", function (event) {
              event.preventDefault();
              document.getElementById(inputId).value = empleado.FullName;
              document.getElementById(`${inputId}EmployeeID`).value =
                empleado.EmployeeID;

              const roleField = document.getElementById(`${inputId}RoleID`);
              if (roleField) {
                roleField.value = empleado.RoleID || "";
              }

              dropdown.style.display = "none";
              dropdown.innerHTML = "";
            });

            dropdown.appendChild(item);
          });

          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      })
      .catch(function (error) {
        console.error("Error al consultar los empleados:", error);
        dropdown.style.display = "none";
      });
  }, 500);
}

// Función auxiliar para capitalizar la primera letra de un string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Función para abrir el modal de creación de usuarios
window.createUser = function () {
  console.log("Opening create user modal.");
  document.getElementById("userForm").reset();
  document.getElementById("userId").value = "";
  document.getElementById("userModalLabel").innerText = "Crear Usuario";
  loadSocios(); // Cargar socios antes de abrir el modal
  $("#userModal").modal("show");
};

/// funcion para cargar socios
function loadSocios(selectedSocioId) {
  axios
    .get("http://158.23.90.252:8081/api/socios")
    .then(function (response) {
      console.log("Socios loaded:", response.data);
      var socios = response.data;
      var selectSocio = document.getElementById("socio");
      selectSocio.innerHTML = '<option value="">Seleccione un socio</option>'; // Resetear opciones

      socios.forEach(function (socio) {
        if (socio.ACTIVO === 1) {
          // Solo mostrar socios activos
          var option = document.createElement("option");
          option.value = socio.ID;
          option.text = socio.SOCIO;
          selectSocio.appendChild(option);
        }
      });

      //si estamos en modo edicion
      if (selectedSocioId) {
        selectSocio.value = selectedSocioId;
      }
    })
    .catch(function (error) {
      console.error("Error al cargar los socios:", error);
      Swal.fire({
        icon: "error", // Icono de error
        title: "Error",
        text: "Error al cargar los socios.", // Mensaje
        toast: true, // Estilo de toast
        position: "top-end", // Ubicación del toast
        showConfirmButton: false, // Sin botón de confirmación
        timer: 3000, // Tiempo que se muestra (3 segundos)
        timerProgressBar: true, // Barra de progreso visual
      });
    });
}

// Función para editar usuarios
window.editUser = function (id) {
  console.log("Editing user with ID:", id);
  axios
    .get(`http://158.23.90.252:8081/api/usuarios/${id}`)
    .then(function (response) {
      console.log("User data received for edit:", response.data);
      var user = response.data;
      document.getElementById("userId").value = user.ID;
      document.getElementById("usuario").value = user.USUARIO;
      document.getElementById("perfil").value = user.PERFIL;
      document.getElementById("activo").value = user.ACTIVO;
      document.getElementById("socio").value = user.SOCIO;
      document.getElementById("sucursal").value = user.SUCURSAL || "";
      document.getElementById("pwd").value = user.PWD;
      document.getElementById("userModalLabel").innerText = "Editar Usuario";

      loadSocios(user.SOCIO); // Cargar socios antes de abrir el modal

      document.getElementById("togglePwdVisibility").style.display = "block";

      $("#userModal").modal("show");
    })
    .catch(function (error) {
      console.error("Error al cargar el usuario:", error);
      Swal.fire({
        icon: "error", // Icono de error
        title: "Error",
        text: "Error al cargar los socios.", // Mensaje
        toast: true, // Estilo de toast
        position: "top-end", // Ubicación del toast
        showConfirmButton: false, // Sin botón de confirmación
        timer: 3000, // Tiempo que se muestra (3 segundos)
        timerProgressBar: true, // Barra de progreso visual
      });
    });
};

// Función para eliminar usuarios
window.deleteUser = function (id) {
  if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
    console.log("Deleting user with ID:", id);
    axios
      .delete(`http://158.23.90.252:8081/api/usuarios/${id}`)
      .then(function (response) {
        console.log("User deleted:", response.data);
        loadUsers();
        Swal.fire({
          icon: "success", // Icono de éxito
          title: "Éxito",
          text: "Usuario eliminado correctamente.", // Mensaje
          toast: true, // Estilo de toast
          position: "top-end", // Ubicación del toast
          showConfirmButton: false, // Sin botón de confirmación
          timer: 3000, // Duración (3 segundos)
          timerProgressBar: true, // Barra de progreso visual
        });
      })
      .catch(function (error) {
        console.error("Error al eliminar el usuario:", error);
        Swal.fire({
          icon: "error", // Icono indicando error
          title: "Error",
          text: "Error al eliminar el usuario.", // Mensaje
          toast: true, // Estilo de toast
          position: "top-end", // Ubicación del toast
          showConfirmButton: false, // Sin botón de confirmación
          timer: 3000, // Duración (3 segundos)
          timerProgressBar: true, // Barra de progreso visual
        });
      });
  }
};
// Función para cargar los usuarios
function loadUsers() {
  console.log("Attempting to load users from API...");
  axios
    .get("http://158.23.90.252:8081/api/usuarios")
    .then(function (response) {
      console.log("API response received:", response);
      if (response.status === 200) {
        var users = response.data;
        var tbody = document.querySelector("#usersTable tbody");
        tbody.innerHTML = "";

        users.forEach(function (user) {
          var row = document.createElement("tr");
          row.innerHTML = `
                            <td>${user.ID}</td>
                            <td>${user.USUARIO}</td>
                            <td>${user.PERFIL}</td>
                            <td>${user.ACTIVO}</td>
                            <td>${user.SOCIO}</td>
                            <td>${user.SUCURSAL}</td>
                            <td>
                                <button class="btn btn-warning btn-sm" onclick="editUser(${user.ID})">Editar</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.ID})">Eliminar</button>
                            </td>
                        `;
          tbody.appendChild(row);
        });
        console.log("Users successfully loaded and displayed.");
      } else {
        console.error("Failed to load users. Status code:", response.status);
        Swal.fire({
          icon: "error", // Icono indicando error
          title: "Error",
          text: "Error al cargar los usuarios.", // Mensaje de error
          toast: true, // Estilo de toast
          position: "top-end", // Ubicación del toast
          showConfirmButton: false, // Sin botón de confirmación
          timer: 3000, // Duración (3 segundos)
          timerProgressBar: true, // Barra de progreso visual
        });
      }
    })
    .catch(function (error) {
      console.error("Error al cargar los usuarios:", error);
      Swal.fire({
        icon: "error", // Icono indicando error
        title: "Error",
        text: "Error al cargar los usuarios.", // Mensaje de error
        toast: true, // Estilo de toast
        position: "top-end", // Ubicación del toast
        showConfirmButton: false, // Sin botón de confirmación
        timer: 3000, // Duración (3 segundos)
        timerProgressBar: true, // Barra de progreso visual
      });
    });
}

// Manejo del formulario de usuario
var userForm = document.getElementById("userForm");
if (userForm) {
  userForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var userId = document.getElementById("userId").value;
    var data = {
      USUARIO: document.getElementById("usuario").value,
      PERFIL: parseInt(document.getElementById("perfil").value, 10),
      ACTIVO: parseInt(document.getElementById("activo").value, 10),
      SOCIO: parseInt(document.getElementById("socio").value, 10),
      SUCURSAL: document.getElementById("sucursal").value,
      PWD: document.getElementById("pwd").value,
    };

    var method = userId ? "PUT" : "POST";
    var url = userId
      ? `http://158.23.90.252:8081/api/usuarios/${userId}`
      : "http://158.23.90.252:8081/api/usuarios";

    console.log("Submitting user form with data:", data);

    axios({
      method: method,
      url: url,
      data: data,
    })
      .then(function (response) {
        console.log("User saved:", response.data);
        $("#userModal").modal("hide");
        loadUsers();
        Swal.fire({
          icon: "success", // Icono indicando éxito
          title: "¡Éxito!",
          text: "Usuario guardado correctamente.", // Mensaje de éxito
          toast: true, // Estilo de toast
          position: "top-end", // Ubicación del toast
          showConfirmButton: false, // Sin botón de confirmación
          timer: 3000, // Duración (3 segundos)
          timerProgressBar: true, // Barra de progreso visual
        });
      })
      .catch(function (error) {
        console.error("Error al guardar el usuario:", error);
        Swal.fire({
          icon: "error", // Icono indicando error
          title: "¡Error!",
          text: "Error al guardar el usuario.", // Mensaje de error
          toast: true, // Estilo de toast
          position: "top-end", // Ubicación del toast
          showConfirmButton: false, // Sin botón de confirmación
          timer: 3000, // Duración (3 segundos)
          timerProgressBar: true, // Barra de progreso visual
        });
      });
  });
}

/////////////////////////////////////////////////////////AQUI SE CARGA LA PAGINA /////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaTermino = document.getElementById("fechaTermino");
  const horaInicioTrabajo = document.getElementById("horaInicioTrabajo");
  const horaSalida = document.getElementById("horaSalida");
  const year = new Date().getFullYear();

  // Insertar / automáticamente mientras se escribe
  function aplicarFormatoFecha(input) {
    input.addEventListener("input", function () {
      let valor = input.value.replace(/\D/g, ""); // Solo números
      if (valor.length > 4) valor = valor.slice(0, 4); // Máximo 4 dígitos (ddmm)
      if (valor.length >= 3) {
        valor = valor.slice(0, 2) + "/" + valor.slice(2);
      }
      input.value = valor;
    });

    // Al perder foco, completar con año automáticamente si está bien escrito
    input.addEventListener("blur", function () {
      completarFechaConAnio(input);
    });
  }

  // Completar dd/mm → dd/mm/yyyy
  function completarFechaConAnio(input) {
    const partes = input.value.split("/");
    if (
      partes.length === 2 &&
      partes[0].length === 2 &&
      partes[1].length === 2
    ) {
      input.value = `${partes[0]}/${partes[1]}/${year}`;
    }
  }

  // Convertir dd/mm/yyyy → yyyy/mm/dd (para backend)
  function convertirFechaAFormatoBackend(fechaStr) {
    const partes = fechaStr.split("/");
    if (partes.length === 3) {
      const [dia, mes, anio] = partes;
      return `${anio}${mes}${dia}`; // <- yyyyMMdd como lo requiere el backend
    }
    return fechaStr;
  }

  // Aplicar formato a ambos campos
  if (fechaInicio) aplicarFormatoFecha(fechaInicio);
  if (fechaTermino) aplicarFormatoFecha(fechaTermino);

  // Validar coherencia de fechas y horas
  function validarFechasHoras() {
    if (
      !fechaInicio.value ||
      !horaInicioTrabajo.value ||
      !fechaTermino.value ||
      !horaSalida.value
    )
      return;
    const inicioFechaISO = convertirFechaAFormatoBackend(fechaInicio.value);
    const terminoFechaISO = convertirFechaAFormatoBackend(fechaTermino.value);
    const h1 = horaInicioTrabajo.value;
    const h2 = horaSalida.value;

    const inicio = new Date(
      `${inicioFechaISO.slice(0, 4)}-${inicioFechaISO.slice(
        4,
        6
      )}-${inicioFechaISO.slice(6)}T${h1}`
    );
    const termino = new Date(
      `${terminoFechaISO.slice(0, 4)}-${terminoFechaISO.slice(
        4,
        6
      )}-${terminoFechaISO.slice(6)}T${h2}`
    );

    if (termino < inicio) {
      Swal.fire({
        icon: "error",
        title: "Error en la validación",
        text: "La fecha y hora de término no pueden ser menores que la de inicio.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      fechaTermino.value = "";
      horaSalida.value = "";
    }
  }

  if (fechaInicio && horaInicioTrabajo && fechaTermino && horaSalida) {
    fechaInicio.addEventListener("change", validarFechasHoras);
    horaInicioTrabajo.addEventListener("change", validarFechasHoras);
    fechaTermino.addEventListener("change", validarFechasHoras);
    horaSalida.addEventListener("change", validarFechasHoras);
  }

  // Antes de enviar: completar año y transformar formato para backend
  const form = document.getElementById("ordenTrabajoForm");
  if (form) {
    form.addEventListener("submit", function () {
      completarFechaConAnio(fechaInicio);
      completarFechaConAnio(fechaTermino);

      fechaInicio.value = convertirFechaAFormatoBackend(fechaInicio.value);
      fechaTermino.value = convertirFechaAFormatoBackend(fechaTermino.value);
    });
  }

  
  const costoInput = document.getElementById("costoAproximado");

  if (costoInput) {
    costoInput.addEventListener("input", function (e) {
      let cursorPos = this.selectionStart;

      // Quitar comas y caracteres no numéricos excepto el punto
      let rawValue = this.value.replace(/,/g, "").replace(/[^\d.]/g, "");

      // Dividir parte entera y decimal
      let parts = rawValue.split(".");
      let integerPart = parts[0];
      let decimalPart = parts[1] ? parts[1].slice(0, 2) : ""; // Máximo 2 decimales

      // Agregar comas a la parte entera
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      // Reconstruir el valor
      let formattedValue = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;

      // Asignar el valor formateado
      this.value = formattedValue;

      // Colocar el cursor al final siempre
      this.setSelectionRange(this.value.length, this.value.length);
    });

    costoInput.addEventListener("blur", function () {
      // Al salir, si hay valor y no hay decimales, poner .00
      if (this.value && !this.value.includes(".")) {
        this.value += ".00";
      }
    });
  }
});

// Convertir texto automáticamente a mayúsculas
//document.querySelectorAll("input[type='text'], textarea").forEach((input) => {
// input.addEventListener("input", function () {
//  this.value = this.value.toUpperCase();
// });
//});
// Selección única de checkboxes para equipo en funcionamiento y refacciones
function setupUniqueCheckboxes(groupName) {
  const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        checkboxes.forEach((cb) => {
          if (cb !== this) cb.checked = false;
        });
      }
    });
  });
}

setupUniqueCheckboxes("equipoFuncionamiento");
setupUniqueCheckboxes("refacciones");
cargarTiposDeProblema();

// Función para habilitar/deshabilitar el botón de inicio de sesión
function toggleLoginButton() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var loginButton = document.getElementById("loginButton");

  if (username && password) {
    loginButton.disabled = false;
  } else {
    loginButton.disabled = true;
  }
}

// Manejo del inicio de sesión
var loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var loginButton = document.getElementById("loginButton");

    // Cambiar texto del botón y mostrar el spinner
    loginButton.disabled = true;
    loginButton.innerText = "Entrando...";
    document.getElementById("loadingSpinner").style.display = "block";

    axios
      .post("/login", {
        username: username,
        password: password,
      })
      .then(function (response) {
        // Éxito en el login
        if (response.data.status === "success") {
          localStorage.setItem("ROUTEID", response.data.ROUTEID);
          localStorage.setItem("B1SESSION", response.data.B1SESSION);
          localStorage.setItem("PERFIL", response.data.PERFIL);

          Swal.fire({
            icon: "success",
            title: "Inicio de sesión exitoso",
            text: response.data.message,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
          });

          // Redirige al menú principal
          window.location.href = "/menu";
        }
      })
      .catch(function (error) {
        // Manejo de errores desde el backend
        document.getElementById("loadingSpinner").style.display = "none";
        loginButton.innerText = "Entrar";
        loginButton.disabled = false;

        var errorMessage = error.response?.data?.message || "Error desconocido";
        var status = error.response?.status;

        if (status === 403) {
          Swal.fire({
            icon: "warning",
            title: "Usuario Inactivo",
            text: errorMessage,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
          });
        } else if (status === 401) {
          Swal.fire({
            icon: "error",
            title: "Error de Autenticación",
            text: errorMessage,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
          });

          // Limpia los campos según el tipo de error
          if (errorMessage.includes("Contraseña incorrecta")) {
            document.getElementById("password").value = ""; // Borrar contraseña
          } else if (errorMessage.includes("Usuario no encontrado")) {
            document.getElementById("username").value = ""; // Borrar usuario
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Ocurrió un error inesperado.",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
          });
        }
      });
  });

  document
    .getElementById("username")
    .addEventListener("input", toggleLoginButton);
  document
    .getElementById("password")
    .addEventListener("input", toggleLoginButton);

  // Asegura que el botón de inicio de sesión está correctamente habilitado/deshabilitado al cargar la página
  toggleLoginButton();
}

habilitarRefacciones();

document
  .getElementById("imprimirButton")
  .addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text("Orden de Trabajo", 10, 10);

    // Obtener valores del formulario
    const formData = new FormData(document.getElementById("ordenTrabajoForm"));
    const datos = Object.fromEntries(formData.entries());

    // Configurar márgenes y posición inicial
    let yPosition = 20;
    const lineHeight = 10; // Altura de cada línea
    const margin = 10; // Margen
    const pageHeight = doc.internal.pageSize.height; // Altura de la página

    // Función para verificar y agregar una nueva página si es necesario
    const checkPageOverflow = () => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Filtrar y mostrar solo los campos llenos
    Object.entries(datos).forEach(([key, value]) => {
      if (value.trim() !== "") {
        doc.setFontSize(12);
        doc.text(`${key}: ${value}`, margin, yPosition);
        yPosition += lineHeight;
        checkPageOverflow(); // Verificar si es necesario agregar una página nueva
      }
    });

    // Obtener refacciones llenas
    const refacciones = capturarRefacciones();
    if (refacciones.length > 0) {
      doc.setFontSize(14);
      doc.text("Refacciones:", margin, yPosition);
      yPosition += lineHeight;
      checkPageOverflow();

      refacciones.forEach((refaccion, index) => {
        if (
          refaccion.cantidad.trim() !== "" ||
          refaccion.numeroParte.trim() !== "" ||
          refaccion.descripcion.trim() !== ""
        ) {
          doc.setFontSize(12);
          doc.text(
            `${index + 1}. Cantidad: ${refaccion.cantidad}, Número de Parte: ${
              refaccion.numeroParte
            }, Descripción: ${refaccion.descripcion}`,
            margin,
            yPosition
          );
          yPosition += lineHeight;
          checkPageOverflow();
        }
      });
    }

    // Descargar el PDF
    doc.save("orden_trabajo.pdf");
  });

// Validar formulario
function validarFormulario() {
  const form = document.getElementById("ordenTrabajoForm");
  const camposRequeridos = Array.from(
    form.querySelectorAll(
      "input:not(.refaccion):not(#tecnico3):not(#noEconomico):not(#modelo):not(#tecnico4):not(#revisoTrabajo):not(#revisoTrabajoEmployeeID):not(#realizoTrabajoRoleID):not(#tecnico3EmployeeID):not(#tecnico4EmployeeID), select:not(.refaccion):not(#tipoProblema), textarea:not(.refaccion)"
    )
  );

  const camposFaltantes = camposRequeridos.filter(
    (campo) => campo.value.trim() === ""
  );

  if (camposFaltantes.length > 0) {
    const nombresCampos = camposFaltantes
      .map((campo) => {
        const label = campo.closest(".form-group")?.querySelector("label");
        return label ? label.innerText : "Campo sin nombre";
      })
      .join(", ");
    Swal.fire({
      icon: "warning", // Icono para advertencias
      title: "Campos incompletos", // Título del mensaje
      html: `Por favor, completa los siguientes campos: <br><b>${nombresCampos}</b>`, // Mensaje dinámico con HTML
      toast: true,
      position: "top-end", // Ubicación en la esquina superior derecha
      showConfirmButton: false, // Sin botón de confirmación
      timer: 5000, // Duración de 5 segundos
      timerProgressBar: true, // Barra de progreso visual
    });

    return false;
  }
  return true;
}

function cargarTiposDeProblema() {
  const tipoProblemaDropdown = document.getElementById("tipoProblema");

  axios
    .get("/tipos_problema") // Endpoint Flask que devolverá los datos de la API
    .then(function (response) {
      const tiposProblema = response.data.value;

      // Limpiar las opciones actuales
      tipoProblemaDropdown.innerHTML = "";

      // Añadir una opción predeterminada
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Seleccione un tipo de problema";
      tipoProblemaDropdown.appendChild(defaultOption);

      // Añadir las opciones de la API
      tiposProblema.forEach((tipo) => {
        const option = document.createElement("option");
        option.value = tipo.ProblemTypeID; // Usar el ID como valor
        option.textContent = tipo.Name; // Mostrar el nombre
        tipoProblemaDropdown.appendChild(option);
      });
    })
    .catch(function (error) {
      console.error("Error al cargar los tipos de problema:", error);
    });
}

function capturarRefacciones() {
  const refacciones = [];

  // Iterar sobre los 20 campos de refacciones
  for (let i = 0; i < 20; i++) {
    const cantidad =
      document.querySelector(`[name="cantidad_${i}"]`)?.value || "";
    const numeroParte =
      document.querySelector(`[name="numeroParte_${i}"]`)?.value || "";
    const descripcion =
      document.querySelector(`[name="descripcion_${i}"]`)?.value || "";

    // Solo agregar si hay datos en al menos uno de los campos
    if (cantidad || numeroParte || descripcion) {
      refacciones.push({
        cantidad,
        numeroParte,
        descripcion,
      });
    }
  }

  return refacciones;
}

// Manejar envío del formulario
document
  .getElementById("ordenTrabajoForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const isSeguridad = !!document.getElementById("ordenTrabajoSeguridadForm");
    if (!isSeguridad) {
      const roleID = parseInt(
        document.getElementById("realizoTrabajoRoleID").value
      );
      if (isNaN(roleID) || roleID !== -2) {
        Swal.fire({
          icon: "error",
          title: "Rol inválido",
          text: "Este usuario no tiene el rol 'TÉCNICO' asignado.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
        return; // 🚫 Se corta el guardado si no es técnico
      }
    }

    if (!validarFormulario()) {
      return; // Detener si hay errores de validación
    }

    // 🔁 Convertir fechas a formato yyyymmdd para backend
    function convertirFechaAFormatoBackend(fechaStr) {
      const partes = fechaStr.split("/");
      if (partes.length === 3) {
        const [dia, mes, anio] = partes;
        return `${anio}${mes}${dia}`;
      }
      return fechaStr;
    }

    const fi = document.getElementById("fechaInicio");
    const ft = document.getElementById("fechaTermino");
    if (fi && ft) {
      fi.value = convertirFechaAFormatoBackend(fi.value);
      ft.value = convertirFechaAFormatoBackend(ft.value);
    }

    const formData = new FormData(this);
    const datos = Object.fromEntries(formData.entries());

    datos.horometro = document.getElementById("horometro")?.value || "";
    datos.descripcionFalla = document
      .getElementById("descripcionFalla")
      .value.replace(/[\r\n]+/g, " ")
      .replace(/,/g, ".")
      .trim();
    datos.trabajoRealizado = document
      .getElementById("trabajoRealizado")
      .value.replace(/[\r\n]+/g, " ")
      .replace(/,/g, ".")
      .trim();

    datos.refacciones = capturarRefacciones();

    axios
      .post("/guardar_csv", datos)
      .then(function () {
        Swal.fire({
          icon: "success",
          title: "Guardado exitoso",
          text: "Orden de trabajo guardada exitosamente en el archivo CSV.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });

        document.getElementById("ordenTrabajoForm").reset();
        habilitarRefacciones();
      })
      .catch(function (error) {
        console.error("Error al guardar la orden:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al guardar la orden.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      });
  });

// Función para alternar la visibilidad de la contraseña
document
  .getElementById("togglePwdVisibility")
  .addEventListener("click", function () {
    const pwdField = document.getElementById("pwd");
    const icon = this.querySelector("i");
    if (pwdField.type === "password") {
      pwdField.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      pwdField.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

// Llamar a habilitarRefacciones para actualizar los campos según la selección

// Función para manejar la visibilidad del menú de usuarios según el perfil
function handleMenuVisibility() {
  const perfil = localStorage.getItem("PERFIL");
  const usersMenuItem = document.querySelector(
    '.nav-item .nav-link[href*="usuarios"]'
  );

  if (perfil == 1) {
    usersMenuItem.style.display = "block";
  } else {
    usersMenuItem.style.display = "none";
  }
}

// Manejo de la selección única de checkboxes para refacciones
document.querySelectorAll('input[name="refacciones"]').forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    if (this.checked) {
      document.querySelectorAll('input[name="refacciones"]').forEach((cb) => {
        if (cb !== this) cb.checked = false;
      });
    }
  });
});
