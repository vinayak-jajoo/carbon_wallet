// State management for seller
let sellerState = {
  credits: 150,
  activeListings: 2,
  pendingSubmissions: 0,
  submissions: [],
  fileCount: 0,
};

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem("sellerState");
  if (saved) {
    sellerState = JSON.parse(saved);
    updateStats();
    updateSubmissionsList();
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem("sellerState", JSON.stringify(sellerState));
}

// Update statistics
function updateStats() {
  document.getElementById("sellerCredits").textContent = sellerState.credits;
  document.getElementById("activeListings").textContent =
    sellerState.activeListings;
  document.getElementById("pendingSubmissions").textContent =
    sellerState.pendingSubmissions;

  gsap.from("#sellerCredits", {
    scale: 1.3,
    color: "#2563EB",
    duration: 0.5,
  });
}

// File upload
function updateFileCount() {
  const fileInput = document.getElementById("fileInput");
  sellerState.fileCount = fileInput.files.length;
  document.getElementById("fileCount").textContent =
    sellerState.fileCount > 0
      ? `${sellerState.fileCount} file(s) selected`
      : "";
}

// Submit form
document.getElementById("submitForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const type = document.getElementById("projectType").value;
  const credits = parseInt(document.getElementById("creditAmount").value);

  if (!credits || sellerState.fileCount === 0) {
    showNotification("Please enter credits and upload documents", "error");
    return;
  }

  const submission = {
    id: Date.now(),
    type,
    credits,
    status: "Verifying",
    date: new Date().toISOString(),
  };

  sellerState.submissions.unshift(submission);
  sellerState.pendingSubmissions++;
  updateSubmissionsList();
  saveState();

  // Reset form
  document.getElementById("creditAmount").value = "";
  document.getElementById("fileInput").value = "";
  sellerState.fileCount = 0;
  document.getElementById("fileCount").textContent = "";

  showNotification("Submission sent for verification", "success");

  // Simulate ML verification
  setTimeout(() => {
    submission.status = "Pending Admin Approval";
    updateSubmissionsList();
    saveState();
    showNotification(
      "Verification complete! Awaiting admin approval",
      "success"
    );
  }, 3000);

  // Simulate admin approval
  setTimeout(() => {
    submission.status = "Approved";
    sellerState.credits += credits;
    sellerState.pendingSubmissions--;
    sellerState.activeListings++;
    updateStats();
    updateSubmissionsList();
    saveState();
    showNotification(
      `${credits} credits approved and added to your wallet!`,
      "success"
    );
  }, 6000);
});

// Update submissions list
function updateSubmissionsList() {
  const list = document.getElementById("submissionsList");
  const section = document.getElementById("submissionsSection");

  if (sellerState.submissions.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  list.innerHTML = sellerState.submissions
    .map(
      (sub) => `
        <div class="listing-item">
            <div class="listing-header">
                <div>
                    <div class="listing-title">${sub.credits} Credits - ${
        sub.type
      }</div>
                    <p style="color: #6B7280; margin-top: 5px;">
                        Submitted: ${new Date(sub.date).toLocaleString()}
                    </p>
                </div>
                <span class="status-badge ${
                  sub.status === "Approved"
                    ? "status-active"
                    : sub.status === "Verifying"
                    ? "status-verifying"
                    : "status-pending"
                }">
                    ${sub.status === "Approved" ? "✓" : "⏳"} ${sub.status}
                </span>
            </div>
        </div>
    `
    )
    .join("");

  gsap.from(".listing-item", {
    opacity: 0,
    x: -20,
    duration: 0.5,
    stagger: 0.1,
  });
}

// Notification system
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const icon = document.getElementById("notificationIcon");
  const msg = document.getElementById("notificationMessage");

  notification.className = `notification ${type}`;
  icon.textContent = type === "success" ? "✓" : "⚠️";
  msg.textContent = message;

  notification.classList.remove("hidden");

  gsap.fromTo(
    notification,
    { y: -100, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: "bounce.out" }
  );

  setTimeout(() => {
    gsap.to(notification, {
      y: -100,
      opacity: 0,
      duration: 0.3,
      onComplete: () => notification.classList.add("hidden"),
    });
  }, 3000);
}

// Initial animations
window.addEventListener("load", () => {
  loadState();

  gsap.from(".stat-card", {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: "power2.out",
  });

  gsap.from(".section", {
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.15,
    delay: 0.3,
    ease: "power2.out",
  });
});
