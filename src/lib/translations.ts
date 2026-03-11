// Translation mappings for French data labels to English

export const groupTranslations: Record<string, string> = {
  "Se divertir et socialiser": "Entertainment & Socializing",
  "Jouer (JHA)": "Gaming (Gambling)",
  "Séjourner dans un complexe": "Resort Stay",
  "Être pris en charge": "Customer Service",
  "Vivre une expérience": "Experience",
};

export const tagTranslations: Record<string, string> = {
  "Ambiance générale": "Overall Atmosphere",
  "Restaurants": "Restaurants",
  "MAS (Machine à sous)": "Slot Machines",
  "Chambre": "Room",
  "Restos, bars et salons": "Restaurants, Bars & Lounges",
  "Personnel": "Staff",
  "Spectacle": "Shows",
  "Propreté": "Cleanliness",
  "Service à la clientèle": "Customer Service",
  "Buffet": "Buffet",
  "Spa": "Spa",
  "Piscine": "Pool",
  "Stationnement": "Parking",
  "Jeux de table": "Table Games",
  "Bar": "Bar",
  "Promotions et récompenses": "Promotions & Rewards",
  "Programme de fidélité": "Loyalty Program",
  "Accueil": "Reception",
  "Bruit": "Noise",
  "Fumée": "Smoke",
  "Prix": "Pricing",
  "Attente": "Wait Times",
  "Sécurité": "Security",
  "Accessibilité": "Accessibility",
  "Wi-Fi": "Wi-Fi",
  "Événements": "Events",
  "Réservation": "Reservations",
  "Transport": "Transportation",
  "Décor": "Decor",
  "Musique": "Music",
  "Toilettes": "Restrooms",
  "Ventilation": "Ventilation",
  "Climatisation": "Air Conditioning",
  "Ascenseur": "Elevator",
  "Petit-déjeuner": "Breakfast",
  "Casino en ligne": "Online Casino",
  "Vestiaire": "Cloakroom",
  "Terrasse": "Terrace",
  "Hébergement": "Accommodation",
  "Poker": "Poker",
  "Bingo": "Bingo",
  "Keno": "Keno",
  "Loterie vidéo": "Video Lottery",
  "Service aux chambres": "Room Service",
  "Navette": "Shuttle",
  "Concierge": "Concierge",
  "Entrée": "Entrance",
  "Café": "Coffee",
  "Salon VIP": "VIP Lounge",
  "Réception": "Front Desk",
  "Check-in / Check-out": "Check-in / Check-out",
  "Équipements": "Amenities",
  "Divertissement": "Entertainment",
  "Confort": "Comfort",
  "Localisation": "Location",
  "Rapport qualité-prix": "Value for Money",
  "Variété de jeux": "Game Variety",
  "Gains": "Winnings",
  "Tournois": "Tournaments",
  "Croupiers": "Dealers",
  "Mises minimales": "Minimum Bets",
};

export const typeTranslations: Record<string, string> = {
  "Élément apprécié / Coup de coeur": "Positive",
  "Irritant / Point de rupture": "Negative",
  "Irritant / Point de douleur": "Negative",
};

export const groupTranslationsExtended: Record<string, string> = {
  ...groupTranslations,
  "Se restaurer": "Dining",
  "Être reconnu et récompensé": "Loyalty & Rewards",
  "Être bien accueilli et accompagné": "Service & Hospitality",
  "Séjourner et se détendre": "Stay & Relaxation",
  "Accéder facilement au site": "Access & Logistics",
  "Terminer sa visite": "End of Visit",
  "Arriver (extérieur/intérieur)": "Arrival",
  "Prendre une pause": "Taking a Break",
  "Explorer/Déclencher": "Explore / Trigger",
  "Profiter des privilèges HM": "VIP Privileges",
  "Débuter sa visite": "Start of Visit",
  "Se déplacer": "Getting Around",
  "Gagner": "Winning",
  "Quitter": "Leaving",
};

export function translateGroup(group: string): string {
  return groupTranslations[group] || group;
}

export function translateTag(tag: string): string {
  return tagTranslations[tag] || tag;
}

export function translateType(type: string): string {
  return typeTranslations[type] || type;
}
