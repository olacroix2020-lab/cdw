// ==========================================================
// UTILITY : normaliser les strings pour filtrage
// ==========================================================
function normalize(s) { return (s||"").toLowerCase().trim(); }

// ==========================================================
// FONCTION GLOBALE : Gérer le menu et afficher la bonne section
// ==========================================================
function chargerPage(nom, page) {
  document.querySelectorAll('#corps > section').forEach(section => {
    section.classList.add('d-none');
    section.classList.remove('d-block');
  });

  try {
    new URL(page);
    window.open(page, "_blank", "noopener,noreferrer");
  } catch(e) {
    const section = document.getElementById(nom.toLowerCase());
    if(section) {
      section.classList.remove('d-none');
      section.classList.add('d-block');
    } else console.warn("Section introuvable:", nom);
  }
}

// ==========================================================
// FONCTION : Afficher message "Aucun événement" stylé Bootstrap
// ==========================================================
function showNoEventsMessage(container) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex justify-content-center w-100 mt-4';
  const alertWrapper = document.createElement('div');
  alertWrapper.className = 'alert d-inline-flex align-items-center text-dark border border-primary';
  alertWrapper.setAttribute('role','alert');
  alertWrapper.style.backgroundColor = '#e0e7ff';
  const icon = document.createElement('i');
  icon.className = 'material-icons me-2 text-dark';
  icon.textContent = 'event_available';
  alertWrapper.appendChild(icon);
  const text = document.createElement('span');
  text.textContent = 'Aucun événement à venir.';
  alertWrapper.appendChild(text);
  wrapper.appendChild(alertWrapper);
  container.appendChild(wrapper);
}

// ==========================================================
// FONCTION : Création d’une card événement (Accueil & Agenda)
// ==========================================================
function createCard(event) {
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'col';
  const importantClass = event.important ? "border-warning" : "";
  const card = document.createElement('div');
  card.className = `card h-100 shadow bg-body-tertiary ${importantClass}`;
  card.style.display = 'flex';
  card.style.flexDirection = 'column';

  // Header
  const header = document.createElement('div');
  header.className = 'card-header bg-white border-0 d-flex justify-content-between align-items-center';
  header.innerHTML = `
    <span class="text-primary fw-semibold text-uppercase">${event.dateFR}</span>
    <div class="text-muted d-flex align-items-center gap-1">
      <i class="material-icons" style="font-size:1rem;">schedule</i>
      <span class="fw-bold text-dark">${event.heure}</span>
    </div>`;
  card.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body d-flex flex-column';
  const titre = document.createElement('h5');
  titre.className = 'card-title text-dark';
  titre.textContent = event.titre ? event.titre.charAt(0).toUpperCase() + event.titre.slice(1) : '';
  body.appendChild(titre);

  if(event.description && event.description !== "Aucune description") {
    const desc = document.createElement('p');
    desc.className = 'card-text text-secondary mb-2 description';
    desc.style.maxHeight = '4.5rem';
    desc.style.overflow = 'hidden';
    desc.textContent = event.description.charAt(0).toUpperCase() + event.description.slice(1);
    body.appendChild(desc);

    if(event.description.length > 100) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-link p-0 text-decoration-none text-primary small see-more-btn';
      btn.type = 'button';
      btn.textContent = 'Suite';
      btn.addEventListener('click', () => {
        const expanded = desc.classList.toggle('expanded');
        desc.style.maxHeight = expanded ? 'none' : '4.5rem';
        btn.textContent = expanded ? 'Moins' : 'Suite';
      });
      body.appendChild(btn);
    }
  }
  card.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'card-footer bg-white border-0 pt-2 mt-auto d-flex flex-wrap gap-1';
  if(event.couleurs && event.couleurs.length > 0) {
    event.couleurs.forEach(cat => {
      const badge = document.createElement('span');
      badge.className = 'badge text-white';
      badge.style.backgroundColor = cat.hex;
      badge.textContent = cat.nom;
      footer.appendChild(badge);
    });
  } else {
    const badge = document.createElement('span');
    badge.className = 'badge text-white';
    badge.style.backgroundColor = '#0d6efd';
    badge.textContent = 'Général';
    footer.appendChild(badge);
  }
  card.appendChild(footer);
  cardWrapper.appendChild(card);
  return cardWrapper;
}

// ==========================================================
// FONCTION : Rendu Accueil (prochains événements seulement)
// ==========================================================
function renderAccueil(allEvents, jours = 8) {
  const container = document.getElementById('accueil-cards');
  if(!container) return;
  container.innerHTML = '';
  const maintenant = new Date();
  const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()).getTime();
  const limite = debutJournee + jours * 24 * 60 * 60 * 1000;
  const events = allEvents.filter(ev => ev.ts >= debutJournee && ev.ts <= limite);
  if (!events.length) {
    showNoEventsMessage(container);
    return;
  }
  events.forEach(ev => container.appendChild(createCard(ev)));
}

// ==========================================================
// FONCTION : Rendu Agenda complet (groupé par mois)
// ==========================================================
function renderAgenda(allEvents) {
  const selecteur = document.getElementById('event-type');
  const agendaContent = document.getElementById('agenda-content');
  if(!agendaContent || !selecteur) return;

  function showEvents(events) {
    agendaContent.innerHTML = '';
    if(!events.length) {
      showNoEventsMessage(agendaContent);
      return;
    }
    const months = {};
    events.forEach(ev => {
      const key = ev.dateISO ? ev.dateISO.slice(0,7) : 'Inconnu';
      if(!months[key]) months[key] = [];
      months[key].push(ev);
    });

    Object.keys(months).sort().forEach(key => {
      const section = document.createElement('div');
      section.className = 'month-section';
      section.style.marginBottom = '3rem';

      const title = document.createElement('div');
      title.className = 'month-title';
      title.style.borderTop = '2px solid #dee2e6';
      title.style.paddingTop = '0.25rem';
      title.style.marginBottom = '1rem';
      title.style.fontSize = '1.5rem';
      title.style.fontWeight = 'bold';
      title.style.textTransform = 'capitalize';
      if(key === 'Inconnu') title.textContent = 'Inconnu';
      else {
        const [year, month] = key.split('-');
        const date = new Date(year, month-1);
        title.textContent = date.toLocaleDateString('fr-FR', { month:'long', year: 'numeric' });
      }
      section.appendChild(title);

      const row = document.createElement('div');
      row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
      months[key].forEach(ev => row.appendChild(createCard(ev)));
      section.appendChild(row);
      agendaContent.appendChild(section);
    });
  }

  function filtrer() {
    const filterValue = normalize(selecteur.value);
    let filtered = allEvents;
    if(filterValue) filtered = allEvents.filter(ev => ev.couleurs.some(c => normalize(c.nom) === filterValue));
    showEvents(filtered);
  }

  selecteur.addEventListener('change', filtrer);
  filtrer(); // affichage initial
}

// ==========================================================
// FONCTION : initialise formulaire de contact
// ==========================================================
function initFormulaireContact() {
document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const resultat = document.getElementById("resultat");
    const btn = form.querySelector("button[type='submit']");

    // Validation Bootstrap native
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Désactiver le bouton pendant l’envoi
    btn.disabled = true;
    btn.textContent = "Envoi en cours...";
    resultat.innerHTML = '<div class="alert alert-info mt-3">⏳ Envoi en cours...</div>';

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyVCb94lLWno29TbmrqAovHDSRgQCulCM9ed3ZoHurupD20KC-MGgt-kjU-GqUBwn5U/exec",
        {
          method: "POST",
          body: new FormData(form),
        }
      );

      const result = await response.json();

      if (result.success) {
        resultat.innerHTML = `
          <div class="alert alert-success mt-3 bg-primary text-white">
            ✅ Message envoyé avec succès !
          </div>`;
        setTimeout(() => {
          resultat.innerHTML = "";
          form.reset();
          form.classList.remove("was-validated");
        }, 3000);
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }

    } catch (err) {
      resultat.innerHTML = `
        <div class="alert alert-danger mt-3">
          ❌ Erreur : ${err.message}
        </div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Envoyer le message";
    }
  });
}