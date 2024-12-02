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
      alert("Hubo un problema al cerrar la sesión. Inténtalo de nuevo.");
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let debounceTimeout; // Variable para almacenar el temporizador de debounce

// Función para buscar clientes
function buscarClientes() {
  const input = document.getElementById("codigoCliente").value;
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

function buscarItemConDebounce(inputElement, rowIndex) {
  const searchValue = inputElement.value;
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
              document.querySelectorAll(".item-name")[rowIndex].value = item.ItemName;
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

function buscarCssrsConDebounce(inputId) {
  const searchValue = document.getElementById(inputId).value;
  const dropdown = document.getElementById(`dropdown${capitalizeFirstLetter(inputId)}`);

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
              document.getElementById(`${inputId}EmployeeID`).value = cssr.EmployeeID; // Colocar el EmployeeID en un input oculto
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
  const searchValue = document.getElementById("noSerie").value;
  const customerCode = document.getElementById("codigoCliente").value;
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
  document.getElementById("marca").value = equipo.Manufacturers.ManufacturerName; // Marca
  document.getElementById("modelo").value = equipo.Items.U_Modelo; // Modelo
  document.getElementById("noEconomico").value = equipo.CustomerEquipmentCards.U_NoEconomico; // Número Económico
  document.getElementById("itemCode").value = equipo.CustomerEquipmentCards.ItemCode; // ItemCode (campo oculto)
}

// Función para mostrar los equipos en el dropdown
function mostrarEquipos(equipos) {
  const dropdown = document.getElementById("dropdownEquipos");
  dropdown.innerHTML = ""; // Limpiar los resultados anteriores

  equipos.forEach(function (equipo) {
    const item = document.createElement("a");
    item.className = "dropdown-item";
    item.href = "#";
    item.innerText = `${equipo.Items.ForeignName} - ${equipo.Items.U_Modelo} - ${equipo.CustomerEquipmentCards.U_NoEconomico}`;
    item.onclick = function () {
      seleccionarEquipo(equipo); // Llenar los campos al seleccionar un equipo
      dropdown.style.display = "none"; // Ocultar el dropdown
    };
    dropdown.appendChild(item);
  });

  dropdown.style.display = equipos.length > 0 ? "block" : "none"; // Mostrar el dropdown si hay equipos
}

// Función para llenar los campos con el equipo seleccionado
function seleccionarEquipo(equipo) {
  document.getElementById("marca").value =
    equipo.Manufacturers.ManufacturerName;
  document.getElementById("modelo").value = equipo.Items.U_Modelo;
  document.getElementById("noEconomico").value =
    equipo.CustomerEquipmentCards.U_NoEconomico;
  document.getElementById("noSerie").value = equipo.Items.ForeignName;
  document.getElementById("itemCode").value = equipo.CustomerEquipmentCards.ItemCode;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Función para habilitar/deshabilitar los campos de refacciones según la selección
function habilitarRefacciones() {
  const instaladasCheckbox = document.getElementById("refaccionesInstaladas");
  const requeridasCheckbox = document.getElementById("refaccionesRequeridas");
  const ambasCheckbox = document.getElementById("refaccionesAmbas");
  const refaccionesTitulo = document.getElementById("refaccionesTitulo");
  const refacciones = document.querySelectorAll("#refaccionesContainer .form-group");

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

document.querySelectorAll('input[name="refacciones"]').forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    if (this.checked) {
      document.querySelectorAll('input[name="refacciones"]').forEach((cb) => {
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
  const searchValue = document.getElementById(inputId).value.trim();
  const dropdown = document.getElementById(`dropdown${capitalizeFirstLetter(inputId)}`);

  // Limpiar el temporizador previo para el campo específico
  clearTimeout(debounceTimeoutEmpleados[inputId]);

  // Si el campo está vacío, ocultar el dropdown y salir
  if (searchValue.length === 0) {
    dropdown.style.display = "none";
    dropdown.innerHTML = ""; // Limpiar el contenido
    return;
  }

  // Establecer el temporizador de debounce
  debounceTimeoutEmpleados[inputId] = setTimeout(() => {
    // Realizar la solicitud al backend Flask
    axios
      .get(`/buscar_empleados?query=${searchValue}`)
      .then(function (response) {
        const empleados = response.data.value;
        dropdown.innerHTML = ""; // Limpiar resultados previos

        // Si hay empleados, mostrar el dropdown con las opciones
        if (empleados.length > 0) {
          empleados.forEach((empleado) => {
            const item = document.createElement("a");
            item.className = "dropdown-item";
            item.href = "#";
            item.innerText = `${empleado.FullName} (${empleado.EmployeeID})`; // Mostrar el nombre completo
            item.onclick = function () {
              document.getElementById(inputId).value = empleado.FullName; // Colocar el nombre completo en el input
              document.getElementById(`${inputId}EmployeeID`).value = empleado.EmployeeID; // Colocar el EmployeeID en un input oculto
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
        console.error("Error al consultar los empleados:", error);
        dropdown.style.display = "none";
      });
  }, 500); // 500 ms de debounce
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
    .get("http://10.2.0.7:8081/api/socios")
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
      alert("Error al cargar los socios.");
    });
}

// Función para editar usuarios
window.editUser = function (id) {
  console.log("Editing user with ID:", id);
  axios
    .get(`http://10.2.0.7:8081/api/usuarios/${id}`)
    .then(function (response) {
      console.log("User data received for edit:", response.data);
      var user = response.data;
      document.getElementById("userId").value = user.ID;
      document.getElementById("usuario").value = user.USUARIO;
      document.getElementById("perfil").value = user.PERFIL;
      document.getElementById("activo").value = user.ACTIVO;
      document.getElementById("socio").value = user.SOCIO;
      document.getElementById("pwd").value = user.PWD;
      document.getElementById("userModalLabel").innerText = "Editar Usuario";

      loadSocios(user.SOCIO); // Cargar socios antes de abrir el modal

      document.getElementById("togglePwdVisibility").style.display = "block";

      $("#userModal").modal("show");
    })
    .catch(function (error) {
      console.error("Error al cargar el usuario:", error);
      alert("Error al cargar el usuario.");
    });
};

// Función para eliminar usuarios
window.deleteUser = function (id) {
  if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
    console.log("Deleting user with ID:", id);
    axios
      .delete(`http://10.2.0.7:8081/api/usuarios/${id}`)
      .then(function (response) {
        console.log("User deleted:", response.data);
        loadUsers();
        alert("Usuario eliminado correctamente.");
      })
      .catch(function (error) {
        console.error("Error al eliminar el usuario:", error);
        alert("Error al eliminar el usuario.");
      });
  }
};
// Función para cargar los usuarios
function loadUsers() {
  console.log("Attempting to load users from API...");
  axios
    .get("http://10.2.0.7:8081/api/usuarios")
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
        alert("Error al cargar los usuarios.");
      }
    })
    .catch(function (error) {
      console.error("Error al cargar los usuarios:", error);
      alert("Error al cargar los usuarios.");
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
      PWD: document.getElementById("pwd").value,
    };

    var method = userId ? "PUT" : "POST";
    var url = userId
      ? `http://10.2.0.7:8081/api/usuarios/${userId}`
      : "http://10.2.0.7:8081/api/usuarios";

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
        alert("Usuario guardado correctamente.");
      })
      .catch(function (error) {
        console.error("Error al guardar el usuario:", error);
        alert("Error al guardar el usuario.");
      });
  });
}
/////////////////////////////////////////////////////////AQUI SE CARGA LA PAGINA /////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {

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
          if (response.data.ROUTEID && response.data.B1SESSION) {
            if (response.data.ACTIVO === 0) {
              alert(
                "Usuario inactivo, favor de checarlo con el departamento de sistemas de IPL"
              );
              document.getElementById("loadingSpinner").style.display = "none";
              loginButton.innerText = "Entrar";
              loginButton.disabled = false;
              return;
            }

            localStorage.setItem("ROUTEID", response.data.ROUTEID);
            localStorage.setItem("B1SESSION", response.data.B1SESSION);
            localStorage.setItem("PERFIL", response.data.PERFIL);

            window.location.href = "/menu";
          } else {
            document.getElementById("loadingSpinner").style.display = "none";
            loginButton.innerText = "Entrar";
            loginButton.disabled = false;
            alert(response.data.message);
          }
        })
        .catch(function (error) {
          document.getElementById("loadingSpinner").style.display = "none";
          loginButton.innerText = "Entrar";
          loginButton.disabled = false;

          var errorMessage = error.response.data.message;
          alert(errorMessage);

          // Manejo de casos específicos de error
          if (errorMessage.includes("Contraseña incorrecta")) {
            document.getElementById("password").value = ""; // Borrar la contraseña
          } else if (errorMessage.includes("Usuario no encontrado")) {
            document.getElementById("username").value = ""; // Borrar el usuario
          }

          // Desactivar el botón de inicio de sesión si es necesario
          toggleLoginButton();
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

      // Validar formulario
      function validarFormulario() {
        const form = document.getElementById("ordenTrabajoForm");
        const camposRequeridos = Array.from(
            form.querySelectorAll("input:not(.refaccion), select:not(.refaccion), textarea:not(.refaccion)")
        );

        const camposFaltantes = camposRequeridos.filter((campo) => campo.value.trim() === "");

        if (camposFaltantes.length > 0) {
            const nombresCampos = camposFaltantes
                .map((campo) => campo.previousElementSibling?.innerText || "Campo sin nombre")
                .join(", ");
            alert(`Por favor, completa los siguientes campos: ${nombresCampos}`);
            return false;
        }
        return true;
    }

    function capturarRefacciones() {
      const refacciones = [];
    
      // Iterar sobre los 20 campos de refacciones
      for (let i = 0; i < 20; i++) {
        const cantidad = document.querySelector(`[name="cantidad_${i}"]`)?.value || "";
        const numeroParte = document.querySelector(`[name="numeroParte_${i}"]`)?.value || "";
        const descripcion = document.querySelector(`[name="descripcion_${i}"]`)?.value || "";
    
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
    document.getElementById("ordenTrabajoForm").addEventListener("submit", function (event) {
        event.preventDefault();

        if (!validarFormulario()) {
            return; // Detener si hay errores de validación
        }

        const formData = new FormData(this);
        const datos = Object.fromEntries(formData.entries());

        datos.horometro = document.getElementById("horometro").value || "";
        datos.descripcionFalla = document.getElementById("descripcionFalla").value || "";
        datos.trabajoRealizado = document.getElementById("trabajoRealizado").value || "";

        datos.refacciones=capturarRefacciones();

        axios
            .post("/guardar_excel", datos)
            .then(function (response) {
                alert("Orden de trabajo guardada exitosamente en Excel.");
                document.getElementById("ordenTrabajoForm").reset();
                habilitarRefacciones(); // Reinicia la configuración de las refacciones
            })
            .catch(function (error) {
                console.error("Error al guardar la orden:", error);
                alert("Hubo un problema al guardar la orden.");
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
});

