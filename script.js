const apiKey = "AIzaSyCR4cV7bODYREbJFFEynZr1WNPftZkNNN4"; // Replace with your Google Safe Browsing API key

document.addEventListener("DOMContentLoaded", function () {
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
  const numParticles = 150; // Reduced for better performance
  const maxDistance = 100; // Max distance for connections
  const maxConnections = 5; // Limit connections per particle
  let mouseX = -9999; // Off-screen initially
  let mouseY = -9999;
  let lastMouseMove = Date.now();
  const idleThreshold = 1000; // 1 second to consider cursor "still"

  // Initialize particles
  function initParticles() {
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.1, // Slow random velocity
        vy: (Math.random() - 0.5) * 0.1,
        color: Math.random() > 0.5 ? "#00DDEB" : "#FF007A", // Cyan or Pink
        connections: [] // Store closest connections
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

  // Precompute connections to avoid repeated calculations
  function updateConnections() {
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.connections = [];

      // Find closest particles
      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          p1.connections.push({ particle: p2, distance });
        }
      }

      // Sort by distance and limit to maxConnections
      p1.connections.sort((a, b) => a.distance - b.distance);
      p1.connections = p1.connections.slice(0, maxConnections);
    }
  }

  // Draw network
  function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isIdle = Date.now() - lastMouseMove > idleThreshold;

    // Update particle positions
    particles.forEach(p => {
      // Random slow movement when idle
      if (isIdle) {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      } else {
        // Move toward cursor (slower)
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 300) { // Influence range
          const force = (1 - distance / 300) * 0.2;
          p.x += (dx / distance) * force;
          p.y += (dy / distance) * force;
        }

        // Slowly return to base position (slower)
        p.x += (p.baseX - p.x) * 0.01;
        p.y += (p.baseY - p.y) * 0.01;
      }
    });

    // Update connections every few frames to reduce load
    if (Date.now() % 10 === 0) {
      updateConnections();
    }

    // Draw connections and particles
    particles.forEach(p1 => {
      // Draw particle
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = p1.color;
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = p1.color;

      // Draw precomputed connections
      p1.connections.forEach(conn => {
        const p2 = conn.particle;
        const opacity = 1 - conn.distance / maxDistance;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${p1.color === "#00DDEB" ? "0, 221, 235" : "255, 0, 122"}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    ctx.shadowBlur = 0; // Reset shadow
  }

  // Animate network with frame rate control
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
    verifyButton.addEventListener("click", checkUrlSafety);
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

  async function checkUrlSafety() {
    console.log("checkUrlSafety triggered");
    const url = urlInput.value.trim();
    if (!url) {
      showResult("Please enter a URL.", "result-error");
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
    if (!urlPattern.test(url)) {
      showResult("Invalid URL format. Please enter a valid URL (e.g., http://example.com).", "result-error");
      return;
    }

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