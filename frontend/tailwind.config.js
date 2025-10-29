module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        berisso: {
          blue: '#002B5C',    // Azul principal
          gold: '#FFD700',    // Dorado
          green: '#3EC04A',   // Verde acento
          gray: '#F5F7FA'     // Fondo claro
        }
      },
      fontSize: {
        'turnero': '8rem',    // Tamaño para números grandes
        'box': '3rem'         // Tamaño para número de box
      },
      spacing: {
        'turnero': '2rem'     // Espaciado consistente
      }
    }
  }
};

