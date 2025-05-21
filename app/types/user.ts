export interface UserListGetDTO {
  id: number;
  name: string;
  username: string;
  status: string;
  avatar?: string;
  wincounter: number; // ✅ Add this line
}


export interface User {
  id: string | null;
  name: string | null;
  username: string | null;
  token: string | null;
  status: string | null;
}
