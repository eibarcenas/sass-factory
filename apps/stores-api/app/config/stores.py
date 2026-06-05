THEMES = {
    "heladeria":   {"primary": "#06b6d4", "secondary": "#cffafe", "accent": "#f59e0b", "background": "#f0fdfe", "font": "Quicksand", "emoji": "🍦"},
    "barberia":    {"primary": "#1f2937", "secondary": "#6b7280", "accent": "#f59e0b", "background": "#f9fafb", "font": "Oswald", "emoji": "💈"},
    "estetica":    {"primary": "#db2777", "secondary": "#fbcfe8", "accent": "#f59e0b", "background": "#fdf2f8", "font": "Cormorant Garamond", "emoji": "💅"},
    "restaurante": {"primary": "#b91c1c", "secondary": "#fecaca", "accent": "#15803d", "background": "#fff7f7", "font": "Playfair Display", "emoji": "🍽️"},
    "panaderia":   {"primary": "#b45309", "secondary": "#fde68a", "accent": "#f97316", "background": "#fffbeb", "font": "Pacifico", "emoji": "🥐"},
    "gym":         {"primary": "#1d4ed8", "secondary": "#bfdbfe", "accent": "#22c55e", "background": "#eff6ff", "font": "Bebas Neue", "emoji": "💪"},
    "mecanico":    {"primary": "#374151", "secondary": "#9ca3af", "accent": "#f97316", "background": "#f9fafb", "font": "Oswald", "emoji": "🔧"},
    "otro":        {"primary": "#6366f1", "secondary": "#a5b4fc", "accent": "#f59e0b", "background": "#f0f1ff", "font": "Inter", "emoji": "🏪"},
}

SAMPLE_ITEMS: dict[str, list[dict]] = {
    "heladeria": [
        {"name": "Sundae de chocolate",  "price": 85,  "description": "3 scoops of artisan chocolate ice cream with whipped cream and cherry"},
        {"name": "Nieve de vainilla",    "price": 40,  "description": "Classic artisan vanilla ice cream"},
        {"name": "Malteada de fresa",    "price": 65,  "description": "Creamy strawberry milkshake with real fruit"},
        {"name": "Paleta de mango",      "price": 30,  "description": "Natural mango popsicle with chili"},
    ],
    "barberia": [
        {"name": "Corte clásico",        "price": 120, "description": "Classic haircut with styling"},
        {"name": "Corte + barba",        "price": 180, "description": "Haircut and beard trim"},
        {"name": "Arreglo de barba",     "price": 80,  "description": "Beard shaping and styling"},
        {"name": "Corte degradado",      "price": 150, "description": "Modern fade haircut"},
    ],
    "estetica": [
        {"name": "Corte de cabello",     "price": 150, "description": "Haircut and styling"},
        {"name": "Tinte completo",       "price": 450, "description": "Full color treatment"},
        {"name": "Manicure",             "price": 120, "description": "Classic manicure with polish"},
        {"name": "Pedicure",             "price": 150, "description": "Relaxing pedicure treatment"},
    ],
    "restaurante": [
        {"name": "Tacos de bistec",      "price": 65,  "description": "3 beef tacos with onion, cilantro and salsa"},
        {"name": "Quesadilla",           "price": 55,  "description": "Large flour tortilla with melted cheese"},
        {"name": "Enchiladas verdes",    "price": 85,  "description": "3 green enchiladas with chicken and cream"},
        {"name": "Agua fresca",          "price": 25,  "description": "Seasonal fresh water"},
    ],
    "panaderia": [
        {"name": "Concha",               "price": 18,  "description": "Traditional Mexican sweet bread"},
        {"name": "Croissant de mantequilla", "price": 35, "description": "Buttery flaky croissant"},
        {"name": "Pay de queso",         "price": 45,  "description": "Slice of homemade cheesecake"},
        {"name": "Bolillo",              "price": 8,   "description": "Fresh baked white bread roll"},
    ],
    "gym": [
        {"name": "Mensualidad",          "price": 450, "description": "Full access monthly membership"},
        {"name": "Clase de spinning",    "price": 80,  "description": "1-hour spinning session"},
        {"name": "Personal training",    "price": 350, "description": "1-hour with certified trainer"},
        {"name": "Plan trimestral",      "price": 1200,"description": "3-month membership"},
    ],
    "mecanico": [
        {"name": "Cambio de aceite",     "price": 350, "description": "Oil change including filter"},
        {"name": "Revisión de frenos",   "price": 200, "description": "Complete brake inspection"},
        {"name": "Alineación y balanceo","price": 300, "description": "Wheel alignment and balancing"},
        {"name": "Diagnóstico general",  "price": 150, "description": "Full vehicle diagnostic scan"},
    ],
    "otro": [
        {"name": "Servicio básico",      "price": 200, "description": "Basic service package"},
        {"name": "Servicio estándar",    "price": 350, "description": "Standard service package"},
        {"name": "Servicio premium",     "price": 500, "description": "Premium service package"},
    ],
}
