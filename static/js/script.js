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
    .get("http://52.153.228.209:8081/api/socios")
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
    .get(`http://52.153.228.209:8081/api/usuarios/${id}`)
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
      .delete(`http://52.153.228.209:8081/api/usuarios/${id}`)
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
      .get("http://52.153.228.209:8081/api/usuarios")
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
         ? `http://52.153.228.209:8081/api/usuarios/${userId}`
         : "http://52.153.228.209:8081/api/usuarios";
 
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

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed.");

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

    // Para asegurarse de que el botón de inicio de sesión está correctamente habilitado/deshabilitado al cargar la página
    toggleLoginButton();
  } // Función para mostrar/ocultar el sidebar en pantallas pequeñas
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("d-none");
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

  function consultarServiceLayer() {
    const numeroSerie = document.getElementById("noSerie").value;

    if (numeroSerie) {
      const routeID = localStorage.getItem("ROUTEID");
      const b1session = localStorage.getItem("B1SESSION");

      axios
        .get(
          `https://52.152.107.200:50000/b1s/v1/ServiceCalls?$filter=DocNum eq ${numeroSerie}`,
          {
            headers: {
              Cookie: `B1SESSION=${b1session}; ROUTEID=${routeID}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          if (response.data.value.length > 0) {
            const data = response.data.value[0];
            document.getElementById("marca").value = data.U_Marca || "";
            document.getElementById("modelo").value = data.U_Modelo || "";
            document.getElementById("noEconomico").value =
              data.U_NumeroEconomico || "";
            // Otros campos que necesites llenar...
          } else {
            alert("No se encontraron datos para el número de serie ingresado.");
          }
        })
        .catch((error) => {
          console.error("Error al consultar el Service Layer:", error);
          alert("Hubo un problema al consultar los datos.");
        });
    }
  }

  // JavaScript para manejar la selección única de checkboxes
  document.addEventListener("DOMContentLoaded", function () {
    const equipoFuncionamientoCheckboxes = document.querySelectorAll(
      'input[name="equipoFuncionamiento"]'
    );
    const refaccionesCheckboxes = document.querySelectorAll(
      'input[name="refacciones"]'
    );

    equipoFuncionamientoCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          equipoFuncionamientoCheckboxes.forEach((cb) => {
            if (cb !== this) cb.checked = false;
          });
        }
      });
    });

    refaccionesCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          refaccionesCheckboxes.forEach((cb) => {
            if (cb !== this) cb.checked = false;
          });
        }
      });
    });
  });
  // Cargar usuarios al iniciar la página
});
