/* ================================================================
   Esta configuración de tsParticles es la misma que usa el CodePen:
   https://codepen.io/overdrivemachines/pen/xybwvY
   Cargamos el canvas de partículas en el div #tsparticles
================================================================= */
tsParticles.load("tsparticles", {
  fpsLimit: 60,
  background: {
    color: "#0d1321"
  },
  interactivity: {
    detectsOn: "canvas",
    events: {
      onHover: {
        enable: true,
        mode: "grab"
      },
      onClick: {
        enable: true,
        mode: "repulse"
      },
      resize: true
    },
    modes: {
      grab: {
        distance: 200,
        links: {
          opacity: 0.5
        }
      },
      repulse: {
        distance: 150,
        duration: 0.4
      }
    }
  },
  particles: {
    color: {
      value: "#ffffff"
    },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.2,
      width: 1
    },
    collisions: {
      enable: false
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "bounce"
      },
      random: false,
      speed: 1.5,
      straight: false
    },
    number: {
      density: {
        enable: true,
        area: 800
      },
      value: 80
    },
    opacity: {
      value: 0.3
    },
    shape: {
      type: "circle"
    },
    size: {
      value: { min: 1, max: 3 }
    }
  },
  detectRetina: true
});
