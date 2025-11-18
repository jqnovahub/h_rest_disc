// Pega aquí la URL del Web App de Google Apps Script cuando lo publiques:
const API_URL = "https://script.google.com/macros/s/AKfycbzhamUkuKTNL6-z8RW44Y-GUberl4S0_ovSJ04WJrAbFOXxY488axrHkOAMSQtZEWtA/exec";

async function callApi(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload) // el browser usa text/plain por default
  });

  if (!response.ok) {
    throw new Error("Error de conexión con el servidor");
  }

  const data = await response.json();
  return data;
}


document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const registerMessage = document.getElementById("registerMessage");
  const registerCode = document.getElementById("registerCode");
  const registerCodeValue = document.getElementById("registerCodeValue");
  const copyCodeBtn = document.getElementById("copyCodeBtn");
  const whatsAppBtn = document.getElementById("whatsAppBtn");

  const redeemForm = document.getElementById("redeemForm");
  const redeemMessage = document.getElementById("redeemMessage");

  // Último cliente registrado (para WhatsApp)
  let lastCustomer = null;

  function showMessage(el, type, text) {
    el.style.display = "block";
    el.className = `message ${type}`;
    el.textContent = text;
  }

  function hideMessage(el) {
    el.style.display = "none";
  }

  // Registrar cliente y generar código
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(registerMessage);
    registerCode.style.display = "none";
    lastCustomer = null;

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre || !telefono) {
      showMessage(registerMessage, "error", "Por favor llena nombre y teléfono.");
      return;
    }

    showMessage(registerMessage, "info", "Procesando...");

    try {
      const result = await callApi({
        action: "create",
        nombre,
        telefono,
      });

      if (result.success) {
        showMessage(
          registerMessage,
          "success",
          `Registro creado para ${result.nombre}. Código generado: ${result.codigo}`
        );
        registerCodeValue.textContent = result.codigo;
        registerCode.style.display = "flex";

        // Guardamos info para WhatsApp
        lastCustomer = {
          codigo: result.codigo,
          nombre: result.nombre,
          telefono: result.telefono,
        };

        registerForm.reset();
      } else {
        showMessage(
          registerMessage,
          "error",
          result.message || "No se pudo crear el registro."
        );
      }
    } catch (err) {
      console.error(err);
      showMessage(registerMessage, "error", err.message || "Error inesperado.");
    }
  });

  // Copiar código
  copyCodeBtn.addEventListener("click", async () => {
    const code = registerCodeValue.textContent;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      showMessage(registerMessage, "success", `Código ${code} copiado al portapapeles.`);
    } catch {
      showMessage(registerMessage, "error", "No se pudo copiar el código.");
    }
  });

  // Enviar por WhatsApp
  whatsAppBtn.addEventListener("click", () => {
    if (!lastCustomer || !lastCustomer.codigo) {
      showMessage(
        registerMessage,
        "error",
        "Primero genera un código para el cliente."
      );
      return;
    }

    const { codigo, telefono } = lastCustomer;

    const baseMessage = `🎉 ¡Invitación Especial de Historias y un Café!

Como cliente leal, te invitamos a descubrir H Restaurant con un 15% de descuento exclusivo.

Tu código: ${codigo}

H Restaurant es nuestro nuevo concepto de fusión creativa. Muestra este código al momento de pagar.

📱 Explora nuestro menú digital:
https://hrestaurant.glide.page

⚠️ Términos:
* No aplica a bebidas alcohólicas
* Válido por 30 días desde la fecha de emisión

¡Esperamos verte pronto en H Restaurant! 🍽️✨`;

    const encodedText = encodeURIComponent(baseMessage);

    // Limpiar el teléfono dejando solo dígitos
    const digits = (telefono || "").replace(/\D/g, "");

    let url;

    if (digits.length >= 8) {
      // Puedes ajustar esto si quieres forzar el código de país: ej. 1787...
      url = `https://wa.me/${digits}?text=${encodedText}`;
    } else {
      // Si el número es inválido, se abre WhatsApp solo con el mensaje
      url = `https://wa.me/?text=${encodedText}`;
    }

    window.open(url, "_blank");
  });

  // Redimir descuento
  redeemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(redeemMessage);

    const busqueda = document.getElementById("busqueda").value.trim();
    if (!busqueda) {
      showMessage(redeemMessage, "error", "Escribe nombre, teléfono o código.");
      return;
    }

    showMessage(redeemMessage, "info", "Buscando y marcando como canjeado...");

    try {
      const result = await callApi({
        action: "redeem",
        term: busqueda,
      });

      if (result.success) {
        showMessage(
          redeemMessage,
          "success",
          `Descuento redimido para ${result.nombre} (${result.telefono}). Código: ${result.codigo}.`
        );
        redeemForm.reset();
      } else {
        showMessage(
          redeemMessage,
          "error",
          result.message || "No se encontró un registro válido."
        );
      }
    } catch (err) {
      console.error(err);
      showMessage(redeemMessage, "error", err.message || "Error inesperado.");
    }
  });
});
