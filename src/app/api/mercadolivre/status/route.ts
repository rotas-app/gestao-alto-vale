import { obterStatusMercadoLivre } from "@/lib/mercadoLivre";
import {
  exigirAdmin,
  respostaErroAutorizacao,
} from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    await exigirAdmin(request);
    return Response.json(await obterStatusMercadoLivre());
  } catch (error) {
    return respostaErroAutorizacao(error);
  }
}
