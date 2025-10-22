document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select so options don't duplicate on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Teilnehmer-Liste als HTML bauen (Liste ohne Bullet + Lösch-Icons)
        let participantsSection = "";
        if (details.participants && details.participants.length) {
          participantsSection = `
            <h5 class="participants-header">Teilnehmer</h5>
            <ul class="participants-list" data-activity="${escapeHtml(name)}">
              ${details.participants
                .map(p => `
                  <li>
                    <span class="participant-email">${escapeHtml(p)}</span>
                    <button class="participant-remove" data-email="${encodeURIComponent(p)}" title="Unregister">
                      🗑️
                    </button>
                  </li>`)
                .join("")}
            </ul>
          `;
        } else {
          participantsSection = `<p class="no-participants">Noch keine Teilnehmer</p>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Zeit:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Verfügbar:</strong> ${spotsLeft} Plätze</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities so the new participant appears immediately
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Delegate click handler for remove buttons
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest && event.target.closest(".participant-remove");
    if (!btn) return;

    const li = btn.closest("li");
    const ul = btn.closest("ul.participants-list");
    const activityName = ul && ul.dataset.activity;
    const email = btn.dataset.email && decodeURIComponent(btn.dataset.email);
    if (!activityName || !email) return;

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, { method: "DELETE" });
      const data = await resp.json();
      if (resp.ok) {
        // refresh list
        fetchActivities();
        messageDiv.textContent = data.message || "Removed";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      } else {
        messageDiv.textContent = data.detail || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });
});

// Small helper to escape HTML when inserting into innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
