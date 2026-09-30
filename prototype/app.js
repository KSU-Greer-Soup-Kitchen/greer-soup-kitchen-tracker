
document.querySelectorAll("form[data-validate]").forEach(function (form) {
  form.setAttribute("novalidate", "");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var errors = checkForm(form);
    showErrors(form, errors);
    if (errors.length === 0) {
      var next = form.getAttribute("data-next");
      if (next) {
        window.location.href = next;
        return;
      }
      var success = document.getElementById(form.getAttribute("data-success"));
      form.hidden = true;
      success.hidden = false;
      success.focus();
      window.scrollTo(0, 0);
    }
  });
});

// Returns a list of { field, message } for every problem in the form.
function checkForm(form) {
  var errors = [];

  form.querySelectorAll(".field").forEach(function (field) {
    field.classList.remove("has-error");
  });

  form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (input) {
    if (!input.value.trim()) {
      errors.push({ input: input, message: input.getAttribute("data-error") });
    }
  });

  // Any email that was typed in must look like an email
  form.querySelectorAll("input[type=email]").forEach(function (input) {
    var value = input.value.trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push({ input: input, message: "Enter an email address like name@example.com" });
    }
  });

  // Groups of checkboxes or radios where at least one must be picked
  form.querySelectorAll("fieldset[data-required]").forEach(function (group) {
    if (!group.querySelector("input:checked")) {
      errors.push({ input: group.querySelector("input"), message: group.getAttribute("data-error") });
    }
  });

  // "Phone or email" style rules: at least one of the listed inputs needs a value
  form.querySelectorAll("[data-one-of]").forEach(function (holder) {
    var ids = holder.getAttribute("data-one-of").split(" ");
    var filled = ids.some(function (id) {
      return document.getElementById(id).value.trim() !== "";
    });
    if (!filled) {
      errors.push({ input: document.getElementById(ids[0]), message: holder.getAttribute("data-error") });
    }
  });

  // List errors in the same order the fields appear on the page
  errors.sort(function (a, b) {
    return a.input.compareDocumentPosition(b.input) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  return errors;
}

function showErrors(form, errors) {
  var summary = form.querySelector(".error-summary");
  var list = summary.querySelector("ul");
  list.innerHTML = "";

  errors.forEach(function (error) {
    var field = error.input.closest(".field");
    field.classList.add("has-error");
    field.querySelector(".field-error").textContent = error.message;

    var item = document.createElement("li");
    var link = document.createElement("a");
    link.href = "#" + error.input.id;
    link.textContent = error.message;
    item.appendChild(link);
    list.appendChild(item);
  });

  if (errors.length > 0) {
    summary.classList.add("show");
    summary.focus();
  } else {
    summary.classList.remove("show");
  }
}

// Show the "name of the person" box only when honor/memory is picked
document.querySelectorAll("[data-reveal]").forEach(function (group) {
  var target = document.getElementById(group.getAttribute("data-reveal"));
  group.addEventListener("change", function () {
    var picked = group.querySelector("input:checked");
    target.hidden = !picked || picked.value === "no";
  });
});

// Dashboard tabs
document.querySelectorAll("[role=tab]").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll("[role=tab]").forEach(function (other) {
      other.setAttribute("aria-selected", "false");
      document.getElementById(other.getAttribute("aria-controls")).hidden = true;
    });
    tab.setAttribute("aria-selected", "true");
    document.getElementById(tab.getAttribute("aria-controls")).hidden = false;
  });
});
