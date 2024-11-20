document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Guard clause if button doesn't exist
    
    const icon = themeToggle.querySelector('i');
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Function to update theme
    const updateTheme = (theme) => {
        console.log('Updating theme to:', theme); // Debug log
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
        
        localStorage.setItem('theme', theme);
        console.log('Current theme attribute:', document.documentElement.getAttribute('data-theme')); // Debug log
    };

    // Function to get initial theme
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        console.log('Saved theme:', savedTheme); // Debug log
        
        if (savedTheme) {
            return savedTheme;
        }
        return darkModeMediaQuery.matches ? 'dark' : 'light';
    };

    // Set initial theme
    const initialTheme = getInitialTheme();
    console.log('Initial theme:', initialTheme); // Debug log
    updateTheme(initialTheme);

    // Listen for theme toggle button clicks
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        console.log('Current theme before toggle:', currentTheme); // Debug log
        
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        console.log('New theme after toggle:', newTheme); // Debug log
        
        updateTheme(newTheme);
    });

    // Listen for system theme changes
    darkModeMediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            updateTheme(e.matches ? 'dark' : 'light');
        }
    });
});
