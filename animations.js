// Login page animations
window.addEventListener("load", () => {
  // Animate login box entrance
  gsap.from(".login-box", {
    scale: 0.9,
    opacity: 0,
    duration: 0.6,
    ease: "back.out(1.7)",
  });

  // Animate logo circle
  gsap.from(".logo-circle", {
    scale: 0,
    rotation: 360,
    duration: 0.8,
    ease: "back.out(2)",
  });

  // Animate title and subtitle
  gsap.from(".login-title", {
    y: -20,
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
  });

  gsap.from(".login-subtitle", {
    y: -10,
    opacity: 0,
    duration: 0.5,
    delay: 0.4,
  });

  // Animate buttons with stagger
  gsap.from(".login-btn", {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.2,
    delay: 0.5,
    ease: "power2.out",
  });

  // Add hover effect to buttons
  const buttons = document.querySelectorAll(".login-btn");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      gsap.to(this, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    button.addEventListener("mouseleave", function () {
      gsap.to(this, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  });
});

// Floating animation for logo
gsap.to(".logo-circle", {
  y: -10,
  duration: 2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
