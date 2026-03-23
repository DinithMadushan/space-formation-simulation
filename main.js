/**
 * main.js
 * Entry point — initialise Simulation + UI once DOM is ready.
 */

(function bootstrap() {

  window.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('sim-canvas');

    if (!canvas) {
      console.error('[SpaceSim] Canvas element #sim-canvas not found.');
      return;
    }

    // 1. Create simulation
    const sim = new Simulation(canvas);

    // 2. Wire up UI
    const ui = new UI(sim);          // eslint-disable-line no-unused-vars

    // 3. Start render loop
    sim.start();

    // 4. Expose to console for debugging
    window.__sim = sim;

    console.log(
      '%c[SpaceSim] Initialised ✓',
      'color:#00e5ff; font-weight:bold;',
      `— ${sim.config.count} units, formation: ${sim.config.formation}`
    );
  });

})();
