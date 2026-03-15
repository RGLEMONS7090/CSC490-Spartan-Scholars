import {useEffect, useState} from "react";

const THEME_KEY = "spartan-scholars-theme";

export default function useTheme(){
    const root = document.documentElement;

    // Load theme or saved preference
    const getInitialTheme = () => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;

        return window.matchMedia("(prefers-color-scheme:dark").matches
            ? "dark"
            : "light";
    };

    const [theme, setTheme] = useState(getInitialTheme);

    // Show theme when it changes
    useEffect(() => {
        root.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme == "dark" ? "light" : "dark");
    };

    return{theme, toggleTheme};
}