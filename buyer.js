// State management for buyer
let buyerState = {
  credits: 50,
  totalPurchases: 0,
  purchases: [],
  selectedListing: null,
};

// Listings data
const listingsData = {
  1: { seller: "Green Energy Co.", credits: 100, price: 25, type: "Solar" },
  2: {
    seller: "Forest Preserve Inc.",
    credits: 250,
    price: 30,
    type: "Reforestation",
  },
  3: {
    seller: "Wind Power Ltd.",
    credits: 180,
    price: 28,
    type: "Wind Energy",
  },
};

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem("buyerState");
  if (saved) {
    buyerState = JSON.parse(saved);
    updateStats();
    updatePurchaseHistory();
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem("buyerState", JSON.stringify(buyerState));
}

// Update statistics
function updateStats() {
  document.getElementById("buyerCredits").textContent = buyerState.credits;
  document.getElementById("totalPurchases").textContent =
    buyerState.totalPurchases;

  gsap.from("#buyerCredits", {
    scale: 1.3,
    color: "#2563EB",
    duration: 0.5,
  });
}

// Purchase modal functions
function openPurchaseModal(listingId) {
  const listing = listingsData[listingId];
  buyerState.selectedListing = { ...listing, id: listingId };

  document.getElementById("modalSeller").textContent = listing.seller;
  document.getElementById("modalAvailable").textContent = listing.credits;
  document.getElementById("purchaseAmount").value = listing.credits;
  document.getElementById("purchaseAmount").max = listing.credits;
  updateModalTotal();

  const modal = document.getElementById("purchaseModal");
  modal.classList.add("active");

  gsap.from(".modal-content", {
    scale: 0.8,
    opacity: 0,
    duration: 0.3,
    ease: "back.out(1.7)",
  });
}

function closeModal() {
  document.getElementById("purchaseModal").classList.remove("active");
  document.getElementById("purchaseAmount").value = "";
  buyerState.selectedListing = null;
}

function updateModalTotal() {
  const amount = parseInt(document.getElementById("purchaseAmount").value) || 0;
  const total = amount * (buyerState.selectedListing?.price || 0);
  document.getElementById(
    "modalTotal"
  ).textContent = `$${total.toLocaleString()}`;
}

function confirmPurchase() {
  const amount = parseInt(document.getElementById("purchaseAmount").value);

  if (!amount || amount > buyerState.selectedListing.credits) {
    showNotification("Invalid purchase amount", "error");
    return;
  }

  const listing = buyerState.selectedListing;
  const total = amount * listing.price;

  // Update buyer credits
  buyerState.credits += amount;
  buyerState.totalPurchases++;

  // Add to purchase history
  const purchase = {
    id: Date.now(),
    seller: listing.seller,
    credits: amount,
    price: listing.price,
    total: total,
    type: listing.type,
    date: new Date().toISOString(),
  };
  buyerState.purchases.unshift(purchase);

  updateStats();
  updatePurchaseHistory();
  saveState();
  closeModal();
  showNotification(`Successfully purchased ${amount} credits!`, "success");
}

// Update purchase history
function updatePurchaseHistory() {
  const section = document.getElementById("purchaseHistorySection");
  const list = document.getElementById("purchaseHistory");

  if (buyerState.purchases.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  list.innerHTML = buyerState.purchases
    .map(
      (p) => `
        <div class="listing-item">
            <div class="listing-header">
                <div>
                    <div class="listing-title">${p.credits} Credits from ${
        p.seller
      }</div>
                    <p style="color: #6B7280; margin-top: 5px;">
                        Purchased: ${new Date(p.date).toLocaleString()}
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.2em; font-weight: 700; color: #1F2937;">
                        $${p.total.toLocaleString()}
                    </div>
                    <div style="font-size: 0.9em; color: #6B7280;">
                        $${p.price}/credit
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");

  gsap.from("#purchaseHistory .listing-item", {
    opacity: 0,
    x: 20,
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

// Event listeners
document
  .getElementById("purchaseAmount")
  .addEventListener("input", updateModalTotal);

// Close modal on outside click
document
  .getElementById("purchaseModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

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

  gsap.from(".marketplace-card", {
    scale: 0.95,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    delay: 0.5,
    ease: "back.out(1.2)",
  });
});

// Card hover animations
document.querySelectorAll(".marketplace-card").forEach((card) => {
  card.addEventListener("mouseenter", function () {
    gsap.to(this, {
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  card.addEventListener("mouseleave", function () {
    gsap.to(this, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  });
});
