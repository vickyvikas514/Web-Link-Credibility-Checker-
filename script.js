const apiKey = "AIzaSyCR4cV7bODYREbJFFEynZr1WNPftZkNNN4"; // Replace with your actual Google Safe Browsing API key

document.addEventListener("DOMContentLoaded", function () {
  // Form submission handling
  const contactForm = document.getElementById("contactForm");
  const loadingOverlay = document.getElementById("loadingOverlay");
  
  if (contactForm) {
    contactForm.addEventListener("submit", function(e) {
      e.preventDefault();
      
      // Show loading overlay
      loadingOverlay.classList.remove("hidden");
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      fetch(this.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Add a small delay to show the loading animation
          setTimeout(() => {
            window.location.href = "thank-you.html";
          }, 1000);
        }
      })
      .catch(error => {
        console.error("Error:", error);
        // Add a small delay to show the loading animation
        setTimeout(() => {
          window.location.href = "thank-you.html";
        }, 1000);
      });
    });
  }

  // Check for reset parameter and clear form if present
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === 'true') {
    // Clear the URL input
    const urlInput = document.getElementById("urlInput");
    if (urlInput) {
      urlInput.value = "";
    }
    
    // Clear the contact form
    if (contactForm) {
      contactForm.reset();
    }
    
    // Hide any visible results
    const result = document.getElementById("result");
    if (result) {
      result.classList.remove("show");
      result.innerHTML = "";
    }
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Remove the reset parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const verifyButton = document.getElementById("verifyButton");
  const urlInput = document.getElementById("urlInput");
  const result = document.getElementById("result");
  const canvas = document.getElementById("spiderWebCanvas");
  const ctx = canvas.getContext("2d");

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = document.body.scrollHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Particle network variables
  const particles = [];
  const numParticles = 200; // Reduced from 250 to 200 for better performance
  const maxDistance = 120; // Reduced from 150 to 120 for better performance
  const maxConnections = 6; // Reduced from 8 to 6 for better performance
  let mouseX = -9999;
  let mouseY = -9999;
  let lastMouseMove = Date.now();
  const idleThreshold = 1000;
  let lastConnectionUpdate = 0;
  const connectionUpdateInterval = 20; // Update connections every 20ms

  // Initialize particles
  function initParticles() {
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2, // Reduced velocity for smoother movement
        vy: (Math.random() - 0.5) * 0.2,
        color: Math.random() > 0.5 ? "#00DDEB" : "#FF007A",
        connections: []
      });
    }
  }
  initParticles();

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top + window.scrollY;
    lastMouseMove = Date.now();
  });

  // Optimized connection update function
  function updateConnections() {
    const currentTime = Date.now();
    if (currentTime - lastConnectionUpdate < connectionUpdateInterval) {
      return;
    }
    lastConnectionUpdate = currentTime;

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.connections = [];

      // Only check nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          p1.connections.push({ particle: p2, distance });
          p2.connections.push({ particle: p1, distance });
        }
      }

      // Sort and limit connections
      p1.connections.sort((a, b) => a.distance - b.distance);
      p1.connections = p1.connections.slice(0, maxConnections);
    }
  }

  // Optimized draw function
  function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update particle positions
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Bounce off edges
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // Cursor influence
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 300) {
        const force = (1 - distance / 300) * 0.6; // Reduced force for smoother movement
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
        
        // Limit velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) { // Reduced max speed
          p.vx = (p.vx / speed) * 1.5;
          p.vy = (p.vy / speed) * 1.5;
        }
      }

      // Return to base position
      p.x += (p.baseX - p.x) * 0.01;
      p.y += (p.baseY - p.y) * 0.01;
    }

    // Update connections less frequently
    updateConnections();

    // Draw connections and particles
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      
      // Draw connections first
      for (let j = 0; j < p1.connections.length; j++) {
        const conn = p1.connections[j];
        const p2 = conn.particle;
        const opacity = (1 - conn.distance / maxDistance) * 0.7;
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${p1.color === "#00DDEB" ? "0, 221, 235" : "255, 0, 122"}, ${opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = p1.color;
      ctx.fill();
      ctx.shadowBlur = 8;
      ctx.shadowColor = p1.color;
    }

    ctx.shadowBlur = 0;
  }

  // Optimized animation loop
  let lastFrameTime = 0;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;

  function animate(currentTime) {
    if (currentTime - lastFrameTime >= frameInterval) {
      drawNetwork();
      lastFrameTime = currentTime;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Verify button logic
  if (verifyButton) {
    console.log("Verify button found!");
    verifyButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent the click from immediately hiding the popup
      checkUrlSafety();
    });
  } else {
    console.error("Verify button not found!");
  }

  // Add input event listener to hide result when URL is cleared
  urlInput.addEventListener("input", function() {
    if (!this.value.trim()) {
      result.classList.remove("show");
      result.innerHTML = "";
    }
  });

  // Hide the result popup when clicking anywhere on the screen
  document.addEventListener("click", function(event) {
    // Only hide the popup if it's visible
    if (result.classList.contains("show")) {
      result.classList.remove("show");
      result.innerHTML = "";
    }
  });

  async function checkUrlSafety() {
    console.log("checkUrlSafety triggered");
    const url = urlInput.value.trim();
    if (!url) {
      showResult("Please enter a URL.", "result-error");
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
    if (!urlPattern.test(url)) {
      showResult("Invalid URL format. Please enter a valid URL.", "result-error");
      return;
    }

    // Reset the popup before showing the "Loading..." state
    result.classList.remove("show");
    result.innerHTML = "";
    showResult("Checking...", "result-checking");
    result.classList.add("show");

    let urlExists = false;
    try {
      const normalizedUrl = url.startsWith("http") ? url : `http://${url}`;
      const response = await fetch(normalizedUrl, { method: "HEAD", mode: "no-cors" });
      urlExists = true;
    } catch (error) {
      urlExists = false;
    }

    const requestBody = {
      client: {
        clientId: "webguardian",
        clientVersion: "1.0.0"
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url: url }]
      }
    };

    try {
      const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));

      if (data.matches && data.matches.length > 0) {
        showResult(`Unsafe! Detected: ${data.matches[0].threatType}`, "result-unsafe");
      } else if (!urlExists) {
        showResult("This URL doesn't appear to exist or isn't accessible.", "result-error");
      } else {
        showResult("Safe! No threats detected.", "result-safe");
      }
    } catch (error) {
      showResult(`Error: ${error.message}`, "result-error");
      console.error("Fetch Error:", error);
    }
  }

  function showResult(message, className) {
    let iconClass, textColor;
    if (className === "result-safe") {
      iconClass = "ri-shield-check-line text-green-500";
      textColor = "text-green-500";
    } else if (className === "result-unsafe") {
      iconClass = "ri-error-warning-line text-red-500";
      textColor = "text-red-500";
    } else if (className === "result-error") {
      iconClass = "ri-question-line text-yellow-500";
      textColor = "text-yellow-500";
    } else {
      iconClass = "ri-loader-4-line text-yellow-500 animate-spin";
      textColor = "text-yellow-500";
    }

    result.innerHTML = `
      <div class="flex flex-col items-center">
        <i class="${iconClass} text-4xl mb-2"></i>
        <p class="text-lg font-semibold ${textColor}">${message}</p>
      </div>
    `;
    result.className = `webguardian-result ${className}`;
    result.classList.add("show");
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      });
    });
  });
});