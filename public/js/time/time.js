document.addEventListener("DOMContentLoaded", function () {
  const birthDate = new Date("1984-12-23");
  const today = new Date();

  // Calculate age in weeks
  const ageInMilliseconds = today - birthDate;
  const ageInWeeks = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 7));

  // Calculate current year and week
  const currentYear = Math.floor(ageInWeeks / 52);
  const currentWeek = ageInWeeks % 52;

  const phases = {
    early: { start: 0, end: 5 },
    elementary: { start: 5, end: 11 },
    middle: { start: 11, end: 14 },
    high: { start: 14, end: 18 },
    college: { start: 18, end: 22 },
    youngAdult: { start: 22, end: 30 },
    adult: { start: 30, end: 50 },
    aging: { start: 50, end: 75 },
    immobile: { start: 75, end: 90 },
  };

  function updateGrid() {
    // console.log("Updating grid with phases:", JSON.stringify(phases, null, 2));
    const weekCells = document.querySelectorAll(".life-grid__week");
    // console.log(`Found ${weekCells.length} week cells`);

    weekCells.forEach((cell, index) => {
      const cellYear = Math.floor(index / 52);
      const cellWeek = index % 52;

      // Reset classes
      cell.className = "life-grid__week";

      // Add past/current/future states
      if (
        cellYear < currentYear ||
        (cellYear === currentYear && cellWeek <= currentWeek)
      ) {
        cell.classList.add("life-grid__week--past");
      }
      if (cellYear === currentYear && cellWeek === currentWeek) {
        cell.classList.add("life-grid__week--current");
      }

      // Add life phase
      Object.entries(phases).forEach(([phase, ages]) => {
        if (cellYear >= ages.start && cellYear < ages.end) {
          cell.classList.add(`life-grid__week--${phase}`);
        }
      });
    });
  }

  // Handle input changes
  document.querySelectorAll(".phase-input").forEach((input) => {
    input.addEventListener("change", function () {
      console.log("Input changed:", {
        phase: this.dataset.phase,
        type: this.dataset.type,
        value: this.value,
        element: this,
      });

      const phase = this.dataset.phase;
      const type = this.dataset.type;
      const value = parseInt(this.value);

      // Validate input
      if (isNaN(value) || value < 0 || value > 90) {
        console.warn("Invalid input value:", value);
        return;
      }

      // Update phases object
      const oldValue = phases[phase][type];
      phases[phase][type] = value;
      console.log(`Updated ${phase}.${type} from ${oldValue} to ${value}`);

      // Validate phase ranges
      if (phases[phase].start >= phases[phase].end) {
        console.warn("Invalid phase range:", phases[phase]);
        // Reset to previous value if invalid
        this.value =
          type === "start" ? phases[phase].end - 1 : phases[phase].start + 1;
        phases[phase][type] = parseInt(this.value);
        console.log("Corrected to:", phases[phase]);
      }

      // Check for overlaps with adjacent phases
      const phaseNames = Object.keys(phases);
      const currentIndex = phaseNames.indexOf(phase);

      if (type === "start" && currentIndex > 0) {
        const previousPhase = phaseNames[currentIndex - 1];
        if (value < phases[previousPhase].end) {
          console.warn("Overlap with previous phase:", previousPhase);
          this.value = phases[previousPhase].end;
          phases[phase].start = phases[previousPhase].end;
        }
      }

      if (type === "end" && currentIndex < phaseNames.length - 1) {
        const nextPhase = phaseNames[currentIndex + 1];
        if (value > phases[nextPhase].start) {
          console.warn("Overlap with next phase:", nextPhase);
          this.value = phases[nextPhase].start;
          phases[phase].end = phases[nextPhase].start;
        }
      }

      console.log("Final phases state:", JSON.stringify(phases, null, 2));
      updateGrid();
    });

    // Also listen for immediate input changes
    input.addEventListener("input", function () {
      console.log("Input typing:", {
        phase: this.dataset.phase,
        type: this.dataset.type,
        value: this.value,
        element: this,
      });

      const phase = this.dataset.phase;
      const type = this.dataset.type;
      const value = parseInt(this.value);

      if (!isNaN(value) && value >= 0 && value <= 90) {
        phases[phase][type] = value;
        updateGrid();
      }
    });
  });

  // Log initial state
  // console.log("Initial phases:", JSON.stringify(phases, null, 2));
  // console.log("Current year:", currentYear, "Current week:", currentWeek);

  // Initial grid update
  updateGrid();
});
