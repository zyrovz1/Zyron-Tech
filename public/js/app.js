"use strict";

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

menuToggle.addEventListener("click", () => {
  const opened = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(opened));
});

navigation.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(element => {
  revealObserver.observe(element);
});

document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    const select = document.querySelector('select[name="service"]');
    const requested = link.dataset.service;

    const matchingOption = Array.from(select.options).find(option =>
      option.value === requested || option.textContent === requested
    );

    if (matchingOption) select.value = matchingOption.value;
  });
});

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

contactForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!contactForm.reportValidity()) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;

  const formData = new FormData(contactForm);

  const payload = {
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    company: formData.get("company").trim(),
    service: formData.get("service"),
    message: formData.get("message").trim()
  };

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  formStatus.textContent = "";
  formStatus.className = "form-status";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Não foi possível enviar.");
    }

    formStatus.textContent = result.message;
    formStatus.classList.add("success");
    contactForm.reset();

  } catch (error) {
    formStatus.textContent =
      error.message || "Erro de conexão. Tente novamente.";
    formStatus.classList.add("error");

  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});
