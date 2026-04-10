export const INDIAN_CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune",
  "Kolkata","Ahmedabad","Jaipur","Chandigarh","Ludhiana","Bathinda",
  "Amritsar","Jalandhar","Patiala","Rohini","Dwarka","Noida",
  "Gurgaon","Faridabad","Ghaziabad","Surat","Vadodara","Nagpur",
  "Indore","Bhopal","Patna","Lucknow","Kanpur","Agra",
  "Varanasi","Meerut","Nashik","Aurangabad","Coimbatore","Madurai",
  "Rajkot","Srinagar","Ranchi","Allahabad","Dhanbad","Vijayawada",
  "Jodhpur","Raipur","Kochi","Visakhapatnam","Thiruvananthapuram","Mysuru",
];

export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Your Location";
          resolve({ city, latitude, longitude });
        } catch {
          resolve({ city: "Your Location", latitude, longitude });
        }
      },
      (err) => reject(err),
      { timeout: 10000 }
    );
  });
}

export function getGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.county ||
      "Unknown area"
    );
  } catch {
    return "Unknown area";
  }
}
