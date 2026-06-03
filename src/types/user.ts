export type UserRole = "admin" | "gestor";

export interface User {
  uid: string;
  nome: string;
  email: string;
  cargo: UserRole;
  status: "ativo" | "inativo";
}