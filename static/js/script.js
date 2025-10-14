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
        icon: "error",
        title: "Error",
        html: "Hubo un problema al cerrar la sesión. Inténtalo de nuevo.",
        confirmButtonText: "Entendido",
        allowOutsideClick: false,
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
        icon: "error",
        title: "Error",
        html: "Error al cargar los socios.",
        confirmButtonText: "Entendido",
        allowOutsideClick: false,
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
        icon: "error",
        title: "Error",
        html: "Error al cargar los socios.",
        confirmButtonText: "Entendido",
        allowOutsideClick: false,
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
          icon: "success",
          title: "Éxito",
          text: "Usuario eliminado correctamente.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      })
      .catch(function (error) {
        console.error("Error al eliminar el usuario:", error);
        Swal.fire({
          icon: "error", // Icono indicando error
          title: "Error",
          html: "Error al eliminar el usuario.", // Mensaje
          confirmButtonText: "Entendido",
          allowOutsideClick: false,
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
          html: "Error al cargar los usuarios.", // Mensaje de error
          confirmButtonText: "Entendido",
          allowOutsideClick: false,
        });
      }
    })
    .catch(function (error) {
      console.error("Error al cargar los usuarios:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        html: "Error al cargar los usuarios.",
        confirmButtonText: "Entendido",
        allowOutsideClick: false,
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
          icon: "success",
          title: "¡Éxito!",
          text: "Usuario guardado correctamente.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      })
      .catch(function (error) {
        console.error("Error al guardar el usuario:", error);
        Swal.fire({
          icon: "error",
          title: "¡Error!",
          html: "Error al guardar el usuario.",
          confirmButtonText: "Entendido",
          allowOutsideClick: false,
        });
      });
  });
}

/////////////////////////////////////////////////////////AQUI SE CARGA LA PAGINA /////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  const tipoOrdenAudi = document.getElementById("tipoOrdenAudi");
  const callTypeInput = document.getElementById("callType");

  const radiosNotificacion = document.querySelectorAll(
    'input[name="ordenBase"]'
  );
  const otBaseContainer = document.getElementById("otBaseContainer");
  const folioContainer = document.getElementById("folioContainer");
  const labelFechaInicio = document.getElementById("labelFechaInicio");
  const labelHoraInicio = document.getElementById("labelHoraInicio");

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
    if (!input) return;
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
    if (!fechaInicio || !horaInicioTrabajo || !fechaTermino || !horaSalida)
      return;
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
        hmtl: "La fecha y hora de término no pueden ser menores que la de inicio.",
        confirmButtonText: "Entendido",
        allowOutsideClick: false,
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

  const form = document.getElementById("ordenTrabajoForm");
  if (form && form.dataset.tipo === "audi") {
    const horasTrabajadasInput = document.getElementById("horasTrabajadas");

    function calcularTermino() {
      const fechaInicioVal = fechaInicio.value;
      const horaInicioVal = horaInicioTrabajo.value;
      const horasTrabajadas = parseFloat(horasTrabajadasInput.value);

      if (!fechaInicioVal || !horaInicioVal || isNaN(horasTrabajadas)) return;

      //Parsear fecha dd/mm o dd/mm/yyyy
      const partes = fechaInicioVal.split("/");
      if (partes.length < 2) return;
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      const anio =
        partes.length === 3
          ? parseInt(partes[2], 10)
          : new Date().getFullYear();
      const fechaBase = new Date(anio, mes - 1, dia);

      //Hora Inicio
      const [h, m] = horaInicioVal.split(":").map(Number);
      fechaBase.setHours(h);
      fechaBase.setMinutes(m);

      //Sumar Horas trabajadas
      fechaBase.setMinutes(fechaBase.getMinutes() + horasTrabajadas * 60);

      //Fecha de termino
      const diaTermino = String(fechaBase.getDate()).padStart(2, "0");
      const mesTermino = String(fechaBase.getMonth() + 1).padStart(2, "0");
      fechaTermino.value = `${diaTermino}/${mesTermino}/${fechaBase.getFullYear()}`;

      //Hora de Salida
      const hora = String(fechaBase.getHours()).padStart(2, "0");
      const minutos = String(fechaBase.getMinutes()).padStart(2, "0");
      horaSalida.value = `${hora}:${minutos}`;
    }
    horasTrabajadasInput.addEventListener("input", calcularTermino);
    horaInicioTrabajo.addEventListener("input", calcularTermino);
    fechaInicio.addEventListener("input", calcularTermino);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const tipo = this.getAttribute("data-tipo") || "ot";
      const isSeguridad = tipo === "seguridad";
      const isAudi = tipo === "audi";

      // ✅ Siempre validar formulario
      if (!validarFormulario()) {
        return; // detener si faltan campos
      }

      if (!isSeguridad && !isAudi) {
        const roleID = parseInt(
          document.getElementById("realizoTrabajoRoleID")?.value
        );
        if (isNaN(roleID) || roleID !== -2) {
          Swal.fire({
            icon: "error",
            title: "Rol inválido",
            html: "Este usuario no tiene el rol 'TÉCNICO' asignado.",
            confirmButtonText: "Entendido",
            allowOutsideClick: false,
          });
          return;
        }
      }

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
      if (fi) fi.value = convertirFechaAFormatoBackend(fi.value);
      if (ft) ft.value = convertirFechaAFormatoBackend(ft.value);

      const formData = new FormData(this);
      const datos = Object.fromEntries(formData.entries());
      datos["data-tipo"] = tipo;

      datos.horometro = document.getElementById("horometro")?.value || "";
      datos.descripcionFalla =
        document
          .getElementById("descripcionFalla")
          ?.value?.replace(/[\r\n]+/g, " ")
          .replace(/,/g, ".")
          .trim() || "";
      if (isSeguridad) {
        datos.personaReporta =
          document
            .getElementById("personaReporta")
            ?.value?.replace(/,/g, " - ")
            .trim() || "";
      } else {
        datos.personaReporta =
          document.getElementById("personaReporta")?.value?.trim() || "";
      }
      datos.trabajoRealizado =
        document
          .getElementById("trabajoRealizado")
          ?.value?.replace(/[\r\n]+/g, " ")
          .replace(/,/g, ".")
          .trim() || "";

      if (document.querySelectorAll("[name^='cantidad_']").length > 0) {
        datos.refacciones = capturarRefacciones();
      }

      console.log("📤 Enviando datos:", datos);

      axios
        .post("/guardar_csv", datos)
        .then(function (res) {
          console.log("📥 Respuesta backend:", res.data);
          Swal.fire({
            icon: "success",
            title: "Guardado exitoso",
            text: `Se guardó ${
              isSeguridad
                ? "Flash Report"
                : isAudi
                ? "OT Audi"
                : "Orden de Trabajo"
            } correctamente en el archivo CSV.`,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
          });

          form.reset();
          if (
            !isSeguridad &&
            !isAudi &&
            typeof habilitarRefacciones === "function"
          ) {
            habilitarRefacciones();
          }
        })
        .catch(function (error) {
          console.error("❌ Error al guardar:", error.response?.data || error);
          Swal.fire({
            icon: "error",
            title: "Error",
            html: "Hubo un problema al guardar.",
            confirmButtonText: "Entendido",
            allowOutsideClick: false,
          });
        });
    });
  }

  /////////////toggle de orden de notificacion/////////////////////////////////////////////

  /////////////toggle de orden de notificacion/////////////////////////////////////////////
  function toggleTipoOrden() {
    const selected = document.querySelector('input[name="ordenBase"]:checked');
    if (!selected) return;

    const tipo = selected.value;
    const refaccionesSection = document.getElementById("refaccionesSection");
    const folioContainer = document.getElementById("folioContainer");
    const labelFechaInicio = document.getElementById("labelFechaInicio");
    const labelHoraInicio = document.getElementById("labelHoraInicio");
    const fechaTermino = document.getElementById("fechaTermino");
    const horaSalida = document.getElementById("horaSalida");
    const defectosSection = document.getElementById("defectosSection");
    const numPersonas = document
      .getElementById("NumPersonas")
      ?.closest(".form-group");
    const horasTrabajadas = document
      .getElementById("horasTrabajadas")
      ?.closest(".form-group");
    const tecnico2 = document
      .getElementById("tecnico3")
      ?.closest(".form-group");
    const tecnico3 = document
      .getElementById("tecnico4")
      ?.closest(".form-group");
    const fechaTerminoContainer = document.getElementById(
      "fechaTerminoContainer"
    );
    const horaSalidaContainer = document.getElementById("horaSalidaContainer");
    const horometroContainer = document
      .getElementById("horometro")
      ?.closest(".form-group");

    // ✅ Verificación por seguridad
    if (!folioContainer || !labelFechaInicio || !labelHoraInicio) return;

    if (tipo === "B") {
      // 🚨 Aviso
      folioContainer.style.display = "block";
      refaccionesSection && (refaccionesSection.style.display = "none");
      numPersonas && (numPersonas.style.display = "none");
      horasTrabajadas && (horasTrabajadas.style.display = "none");
      tecnico2 && (tecnico2.style.display = "none");
      tecnico3 && (tecnico3.style.display = "none");
      fechaTerminoContainer && (fechaTerminoContainer.style.display = "none");
      horaSalidaContainer && (horaSalidaContainer.style.display = "none");
      horometroContainer && (horometroContainer.style.display = "block");
      defectosSection.style.display = "none";

      labelFechaInicio.textContent = "Fecha de llegada al taller:";
      labelHoraInicio.textContent = "Hora de llegada al taller:";
      if (fechaTermino) fechaTermino.value = "";
      if (horaSalida) horaSalida.value = "";
    } else {
      // 🚨 Reporte de Trabajo
      folioContainer.style.display = "block";
      refaccionesSection && (refaccionesSection.style.display = "block");
      numPersonas && (numPersonas.style.display = "block");
      horasTrabajadas && (horasTrabajadas.style.display = "block");
      tecnico2 && (tecnico2.style.display = "block");
      tecnico3 && (tecnico3.style.display = "block");
      fechaTerminoContainer && (fechaTerminoContainer.style.display = "block");
      horaSalidaContainer && (horaSalidaContainer.style.display = "block");
      horometroContainer && (horometroContainer.style.display = "none");
      defectosSection.style.display = "block";

      labelFechaInicio.textContent = "Fecha de inicio de trabajo:";
      labelHoraInicio.textContent = "Hora de inicio de trabajo:";
    }
  }

  // 🔹 Escuchar cambios en los radios
  if (radiosNotificacion.length > 0) {
    radiosNotificacion.forEach((radio) => {
      radio.addEventListener("change", toggleTipoOrden);
    });
  }

  // 🔹 Ejecutar solo si ya hay uno seleccionado al cargar
  window.addEventListener("load", function () {
    setTimeout(() => {
      const checkedRadio = document.querySelector(
        'input[name="ordenBase"]:checked'
      );
      if (checkedRadio) {
        toggleTipoOrden();
      }
    }, 200);
  });

  ////////////////////se llena el tipo de orden de uadi y su equivalente al tipo de orden que se usa en ipl

  if (tipoOrdenAudi && callTypeInput) {
    function syncCallType() {
      const selected = tipoOrdenAudi.options[tipoOrdenAudi.selectedIndex];
      callTypeInput.value = selected.getAttribute("data-calltype") || "";
    }

    tipoOrdenAudi.addEventListener("change", syncCallType);
    syncCallType(); // ejecutar al cargar
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
          window.location.href = "/dashboard";
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
            html: errorMessage,
            confirmButtonText: "Entendido",
            allowOutsideClick: false,
          });
        } else if (status === 401) {
          Swal.fire({
            icon: "error",
            title: "Error de Autenticación",
            html: errorMessage,
            confirmButtonText: "Entendido",
            allowOutsideClick: false,
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
            html: "Ocurrió un error inesperado.",
            confirmButtonText: "Entendido",
            allowOutsideClick: false,
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

/////////////////////////////////////Validar formulario para campos obligatorios//////////////////////////////////////
function validarFormulario() {
  const form = document.getElementById("ordenTrabajoForm");
  const tipo = form.dataset.tipo; // "ot", "audi", "seguridad"
  let camposRequeridos = [];

  if (tipo === "audi") {
    camposRequeridos = Array.from(
      form.querySelectorAll(
        "input:not(.refaccion):not(#tecnico3):not(#tecnico4):not(#revisoTrabajo):not(#noEconomico):not(#modelo), select:not(.refaccion), textarea:not(.refaccion)"
      )
    );
  } else if (tipo === "seguridad") {
    camposRequeridos = Array.from(
      form.querySelectorAll(
        "input:not(.refaccion):not(#noEconomico):not(#modelo), select:not(.refaccion), textarea:not(.refaccion)"
      )
    );
  } else if (tipo === "seguridad") {
    // 📌 Flash Report → TODOS los campos obligatorios
    camposRequeridos = Array.from(
      form.querySelectorAll(
        "input:not(.refaccion), select:not(.refaccion), textarea:not(.refaccion)"
      )
    );
  } else {
    camposRequeridos = Array.from(
      form.querySelectorAll(
        "input:not(.refaccion):not(#tecnico3):not(#noEconomico):not(#modelo):not(#tecnico4):not(#revisoTrabajo):not(#revisoTrabajoEmployeeID):not(#realizoTrabajoRoleID):not(#tecnico3EmployeeID):not(#tecnico4EmployeeID), select:not(.refaccion):not(#tipoProblema), textarea:not(.refaccion)"
      )
    );
  }

  // ⚡ Filtrar solo campos visibles y que realmente se deben llenar
  camposRequeridos = camposRequeridos.filter((campo) => {
    return campo.offsetParent !== null; // solo visibles
  });

  // 🔍 Buscar campos vacíos
  const camposFaltantes = camposRequeridos.filter(
    (campo) => campo.value.trim() === ""
  );

  if (camposFaltantes.length > 0) {
    console.log(
      "Campos faltantes:",
      camposFaltantes.map((c) => c.id || c.name)
    );
    const nombresCampos = camposFaltantes
      .map((campo) => {
        const label = campo.closest(".form-group")?.querySelector("label");
        return label ? label.innerText : campo.name;
      })
      .join(", ");

    let titulo = "Campos incompletos";
    if (tipo === "audi") titulo = "Campos incompletos en OT Audi";
    else if (tipo === "seguridad")
      titulo = "Campos incompletos en Flash Report";
    else titulo = "Campos incompletos en Orden de Trabajo";

    Swal.fire({
      icon: "warning",
      title: titulo,
      html: `Por favor, completa los siguientes campos: <br><b>${nombresCampos}</b>`,
      confirmButtonText: "Entendido",
      allowOutsideClick: false,
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

      const isAudi =
        document.getElementById("ordenTrabajoForm")?.dataset.tipo === "audi";

      let lista = tiposProblema;

      if (isAudi) {
        // 🔹 IDs permitidos SOLO para Audi
        const idsAudi = ["2", "7", "8", "11", "198"];
        lista = tiposProblema.filter((t) =>
          idsAudi.includes(String(t.ProblemTypeID))
        );
      }

      // Añadir las opciones de la API
      lista.forEach((tipo) => {
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

////////////////////////////////////fin de tipos de problemas /////////////////////////////////////
////////////////////////////////////empieza causas y tipos de daños////////////////////////////////
const causasTabla = [
  { code: "E:CONTACTOR", name: "CONTACTOR", danio: "ELECTRONICO" },
  { code: "E:CONTROLADOR", name: "CONTROLADOR", danio: "ELECTRONICO" },
  { code: "E:CONVERTIDOR", name: "CONVERTIDOR", danio: "ELECTRONICO" },
  { code: "E:CPP", name: "CPP", danio: "ELECTRONICO" },
  { code: "E:DISPLAY", name: "DISPLAY", danio: "ELECTRONICO" },
  { code: "E:FRENO", name: "FRENO E", danio: "ELECTRONICO" },
  { code: "E:FUSIBLES", name: "FUSIBLES E", danio: "ELECTRONICO" },
  { code: "E:JOSTICK", name: "JOSTICK", danio: "ELECTRONICO" },
  { code: "E:POTENCIOMENTRO", name: "POTENCIOMENTRO", danio: "ELECTRONICO" },
  { code: "E:RCU", name: "RCU", danio: "ELECTRONICO" },
  { code: "E:RELEVADORES", name: "RELEVADORES", danio: "ELECTRONICO" },
  { code: "E:SENSOR", name: "SENSOR", danio: "ELECTRONICO" },
  { code: "E:TARJETAS", name: "TARJETAS", danio: "ELECTRONICO" },
  { code: "E:TIMON", name: "TIMON", danio: "ELECTRONICO" },
  { code: "EL:ARNES", name: "ARNES", danio: "ELECTRICO" },
  { code: "EL:BATERIA", name: "BATERIA", danio: "ELECTRICO" },
  { code: "EL:BOTONERA", name: "BOTONERA", danio: "ELECTRICO" },
  { code: "EL:CABLE VIEJERO", name: "CABLE VIEJERO", danio: "ELECTRICO" },
  { code: "EL:CLAXON", name: "CLAXON", danio: "ELECTRICO" },
  { code: "EL:CONECTORES", name: "CONECTORES", danio: "ELECTRICO" },
  { code: "EL:FUSIBLES", name: "FUSIBLES", danio: "ELECTRICO" },
  { code: "EL:LUCES", name: "LUCES", danio: "ELECTRICO" },
  { code: "EL:MOTOR", name: "MOTOR", danio: "ELECTRICO" },
  { code: "H:BOMBA", name: "BOMBA", danio: "HIDRAULICO" },
  { code: "H:CILINDRO", name: "CILINDRO", danio: "HIDRAULICO" },
  { code: "H:CONEXIONES", name: "CONEXIONES", danio: "HIDRAULICO" },
  { code: "H:ELECTRO VALVULAS", name: "ELECTRO VALVULAS", danio: "HIDRAULICO" },
  { code: "H:RETENES", name: "RETENES", danio: "HIDRAULICO" },
  { code: "H:SELLOS", name: "SELLOS", danio: "HIDRAULICO" },
  { code: "H:VALVULAS", name: "VALVULAS", danio: "HIDRAULICO" },
  { code: "M:ABRAZADERAS", name: "ABRAZADERAS", danio: "MECANICO" },
  { code: "M:ASIENTO", name: "ASIENTO", danio: "MECANICO" },
  { code: "M:BAQUELITAS", name: "BAQUELITAS", danio: "MECANICO" },
  {
    code: "M:BIRLOS / TORNILLERIA",
    name: "BIRLOS / TORNILLERIA",
    danio: "MECANICO",
  },
  { code: "M:CADENA", name: "CADENA", danio: "MECANICO" },
  {
    code: "M:CARRO PORTA HORQUILLAS",
    name: "CARRO PORTA HORQUILLAS",
    danio: "MECANICO",
  },
  { code: "M:EJE DE DIRECCION", name: "EJE DE DIRECCION", danio: "MECANICO" },
  { code: "M:EJE DE TRACCION", name: "EJE DE TRACCION", danio: "MECANICO" },
  { code: "M:FRENO", name: "FRENO", danio: "MECANICO" },
  { code: "M:HORQUILLAS", name: "HORQUILLAS", danio: "MECANICO" },
  { code: "M:LLAVIN", name: "LLAVIN", danio: "MECANICO" },
  { code: "M:POLEAS", name: "POLEAS", danio: "MECANICO" },
  { code: "M:RESORTE", name: "RESORTE", danio: "MECANICO" },
  { code: "M:RODAJAS", name: "RODAJAS", danio: "MECANICO" },
  { code: "M:RODAMIENTOS", name: "RODAMIENTOS", danio: "MECANICO" },
  { code: "M:ROTULAS / PERNOS", name: "ROTULAS / PERNOS", danio: "MECANICO" },
  { code: "M:RUEDAS", name: "RUEDAS", danio: "MECANICO" },
  { code: "M:SEGURO DE BATERIA", name: "SEGURO DE BATERIA", danio: "MECANICO" },
  {
    code: "M:SISTEMA DE ENGANCHE",
    name: "SISTEMA DE ENGANCHE",
    danio: "MECANICO",
  },
  { code: "M:VOLANTE", name: "VOLANTE", danio: "MECANICO" },
  { code: "O:BANDA ANTIESTATICA", name: "BANDA ANTIESTATICA", danio: "OTROS" },
  { code: "O:CHASIS", name: "CHASIS", danio: "OTROS" },
  {
    code: "O:CINTURON DE SEGURIDAD",
    name: "CINTURON DE SEGURIDAD",
    danio: "OTROS",
  },
  { code: "O:ESPEJO", name: "ESPEJO", danio: "OTROS" },
  { code: "O:PAREMETROS", name: "PAREMETROS", danio: "OTROS" },
];

const tipoDanioTabla = [
  { code: "E:CALIBRACION", name: "CALIBRACION E", danio: "ELECTRONICO" },
  { code: "E:CODIGO DE ERROR", name: "CODIGO DE ERROR", danio: "ELECTRONICO" },
  {
    code: "E:COMPONENTE INOPERANTE",
    name: "COMPONENTE INOPERANTE E",
    danio: "ELECTRONICO",
  },
  { code: "EL:ARNES DANADO", name: "ARNES DANADO", danio: "ELECTRICO" },
  {
    code: "EL:COMPONENTE INOPERANTE",
    name: "COMPONENTE INOPERANTE EL",
    danio: "ELECTRICO",
  },
  { code: "EL:FALSO CONTACTO", name: "FALSO CONTACTO", danio: "ELECTRICO" },
  { code: "H:AJUSTE", name: "AJUSTE", danio: "HIDRAULICO" },
  { code: "H:CALIBRACION", name: "CALIBRACION", danio: "HIDRAULICO" },
  {
    code: "H:COMPONENTE INOPERANTE",
    name: "COMPONENTE INOPERANTE",
    danio: "HIDRAULICO",
  },
  { code: "H:FUGA", name: "FUGA", danio: "HIDRAULICO" },
  { code: "M:CALIBRACION", name: "CALIBRACION M", danio: "MECANICO" },
  { code: "M:DESGASTE NATURAL", name: "DESGASTE NATURAL", danio: "MECANICO" },
  { code: "M:FISURA", name: "FISURA", danio: "MECANICO" },
  { code: "M:FRACTURA", name: "FRACTURA", danio: "MECANICO" },
  { code: "M:RUIDOS INUSUALES", name: "RUIDOS INUSUALES", danio: "MECANICO" },
  {
    code: "O:CALIBRACION / AJUSTE",
    name: "CALIBRACION / AJUSTE",
    danio: "OTROS",
  },
  { code: "O:DESGASTE NATURAL", name: "DESGASTE NATURAL O", danio: "OTROS" },
  { code: "O:FRACTURA", name: "FRACTURA O", danio: "OTROS" },
  { code: "O:GOLPE", name: "GOLPE", danio: "OTROS" },
];

// Mapa entre ID del defecto (tipoProblema) y prefijos de código
const defectosPrefijos = {
  2: ["EL:"], // Eléctrico
  7: ["H:"], // Hidráulico
  8: ["M:"], // Mecánico
  198: ["E:"], // Electrónico
  11: ["O:"], // Otros
};

// Función para actualizar selects
function actualizarCausasYDanios(defectoSeleccionado) {
  const causaSelect = document.getElementById("causa");
  const tipoDanioSelect = document.getElementById("tipoDanio");

  causaSelect.innerHTML = '<option value="">Seleccione una causa</option>';
  tipoDanioSelect.innerHTML =
    '<option value="">Seleccione un tipo de daño</option>';

  const prefijos = defectosPrefijos[defectoSeleccionado];
  if (!prefijos) return;

  const causasFiltradas = causasTabla.filter((c) =>
    prefijos.some((p) => c.code.startsWith(p))
  );

  const daniosFiltrados = tipoDanioTabla.filter((d) =>
    prefijos.some((p) => d.code.startsWith(p))
  );

  causasFiltradas.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.code;
    option.textContent = c.name;
    causaSelect.appendChild(option);
  });

  daniosFiltrados.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.code;
    option.textContent = d.name;
    tipoDanioSelect.appendChild(option);
  });
}

// Escuchar cambios del select de Defectos
document.addEventListener("DOMContentLoaded", function () {
  const tipoProblemaSelect = document.getElementById("tipoProblema");
  if (tipoProblemaSelect) {
    tipoProblemaSelect.addEventListener("change", function () {
      const valor = parseInt(this.value);
      actualizarCausasYDanios(valor);
    });
  }
});
////////////////////////////////////fin de causas y tipo de daños//////////////////////////////////

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
// Manejar envío del formulario (OT, Flash Report, Audi futuro)

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
