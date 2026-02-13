const API_URL = "https://safespot-backend-vx2w.onrender.com";
const USER_ID = "Swetha_01";

export type Protector = { _id: string; name: string; phone: string };

export const fetchProtectors = async (): Promise<Protector[]> => {
  const res = await fetch(`${API_URL}/api/protectors/${USER_ID}`);
  if (!res.ok) return [];
  const data = await res.json();

  // backend returns array of protectors
 return (Array.isArray(data) ? data : [])
  .map((p: any) => ({
    _id: String(p._id),
    name: String(p.name || "Protector"),
    phone: String(p.phone || "").replace(/\s+/g, ""), // remove spaces
  }))
  .filter((p) => p.phone.length >= 8);
};