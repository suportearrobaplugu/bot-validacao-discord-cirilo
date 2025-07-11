// 📦 Dependências necessárias
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const cron = require('node-cron');
require('dotenv').config();

// 🌐 Express para manter o Replit online
const app = express();
app.get('/', (req, res) => res.send('Bot rodando!'));
app.listen(3000, () => console.log('Servidor express ativo na porta 3000'));

// 🔐 Credenciais diretamente no código (evite em produção)
const credentials = {
  type: "service_account",
  project_id: "bot-discord-validacao",
  private_key_id: "c61dd1da64e2784b2728e639ce4f8f3814782789",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCiAK5E2IWNGAmx
JVx7RcXoHgjn2RxrNyfB+gi770xu/pVUjHjviFMWcXGL7MXgJWOoOCaMkM0xUEtG
nLRAwcyAsc/hclAcOSV1gvoKUmpx5pAmqWAAXZsBJbD1sjoIWJYdz67yKXxU7d5E
p8oWDETgg/FX8SBgzAFoVRPjYoMwFvm+6+jQ/TCUcNn4zowu2DI4huzghTNOrc3r
Un3LjAnBl7e59MPYxKk4WwLDCAQLYWg0CBoQIIYExGr8Jrl1GaHVXlSOJSwgYWSO
fykMfWDU/ejFnsWvpVCVbTiPgIGW770FCr+k/SeIjJ/v9j8GiGantVbxm7AM3C45
JSZzmvIzAgMBAAECggEAQ8YoIfo5aQ0w5NDeD15hzNlf3Wr5lislcWPiqokSv263
V39LCt7L79w25hSAteS+e/49tlnP1j0iuOBPErZhEUgSUV1rAVuw/af1ZkMTcCJG
lT4PwSdn9QNpNGjDGYHCD6e2p23Oq5M2BR/zDeVFHW5lleZ1JrnCLv1EzECG5KNU
gns0guG8GOJ/3WHBdBX7TuFDaJJsOaWu7r8uoGQxafb04L+tRwGPSU9fJAp8faSx
CU02Ifs3jL4788VEYv8iGo05Qdo2n4g7rl3jbr+GetMvshjH6YQwTc+29ij1OSbx
+Fin/kxBXm8p2v0XhtE2yOLiOtYPhqDY7BBuj3uqHQKBgQDkgKsB3D/aagiR8kXg
5ZbwNfGuv09yXt6M7kB8ugOq7S47WxX+KQFybTsjMHJMp1FFnGsC3pnh4p3afHxn
YlQhJxqBsWUVnu/lAWMTzj48WkF4Zx4NwdMWSJ/12/9HfFJ4MkAc8oD254C3HIPB
YTxO2SLgEqdR6DgULnStKO1RPwKBgQC1f2RNyhSr3qsljKQ71wjlOoVZJyBpMzSl
C6wn/7SHA+DgS1m5EghL6RhaThFnmEPbODDYn61ZCkXkrWMWHNdkQI9tkDlGPnNz
zxItncsqCoQ+T3AHP+ODK+I4RKVoydeXh1sdW/Ed7zdoiGMCfq0+nZtWkmM6e6QC
BKnio2uuDQKBgBL89jjzWoMF6KxoG5JywbY4ZVsGHs38QDYp3kX/FyrvBrZ7/Tnf
onUlypJEBluEU+aa9vGIGfWBZWiwi43zx9Xxb+xzF1lSmdDH6rnMm7NcNLCSsRan
kqj5ZAGERJRmKlw+oMFHDZx25GVTA0fgkqhittkz85+E0pQqwBtbmUz1AoGBAI5G
VKyeEuI/5M3EmCHIiVKYM1wVzdRprYULx2J7klqccbWhm632Msa+7LYtqHsa42Z/
f9rwIQVBhlSijqAQ78/IxCZQ/nTQE9TeqBNWNKK6J7xorRshvAlhZy5QsZGZWAWS
t5wmLLcYhMjO0T5tawVAqzqL+nkn3wMuALaHAKwpAoGABQ0Rv1OEiiZdvWXp/doq
LUC5cHvZrxacYXJnk17pPQ1ylCmOP/bmO3xPzK/SV/SS85ENnqlDlnFcRZCvFSwZ
xf/dRe3PAdFgp4NelusswXMUKMCVFfypP+ifY9DzB61phIdG5PwsEbS21aHSNrre
1HhJozuwd7h9m+zp5zwyylI=
-----END PRIVATE KEY-----`,
  client_email: "bot-discord@bot-discord-validacao.iam.gserviceaccount.com",
  client_id: "118146359298173031900",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/bot-discord%40bot-discord-validacao.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// 🟡 Lista de e-mails autorizados (carregada da planilha)
let emailsPermitidos = [];

// 🕒 Atualiza a lista a cada minuto
cron.schedule('* * * * *', async () => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1FPoGtMZ0y9ncX0AQWxsJatxNPzaCXpd36L2jFD8xUVI',
      range: 'ALUNOS!C:C'
    });
    const valores = res.data.values || [];
    emailsPermitidos = valores.map(row => row[0]?.toLowerCase().trim()).filter(Boolean);
    console.log(`[PLANILHA ATUALIZADA] Total de e-mails: ${emailsPermitidos.length}`);
  } catch (err) {
    console.error('[ERRO PLANILHA]', err);
  }
});

// 🤖 Discord Bot Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`Bot está online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.channel.name.includes('validacao')) return;

  const match = message.content.match(/^!validar\s(.+)$/i);
  if (!match) return;

  const email = match[1].trim().toLowerCase();

  if (emailsPermitidos.includes(email)) {
    const cargoAluno = message.guild.roles.cache.find(r => r.name === 'Membro');
    const cargoVisitante = message.guild.roles.cache.find(r => r.name === 'Visitante');

    try {
      if (cargoAluno) await message.member.roles.add(cargoAluno);
      if (cargoVisitante) await message.member.roles.remove(cargoVisitante);
      message.reply('Seja Bem-vindo(a) à Comunidade!');
    } catch (err) {
      console.error('[ERRO CARGOS]', err);
      message.reply('❌ Erro ao atribuir cargos. Fale com o suporte.');
    }
  } else {
    message.reply('❌ E-mail não encontrado. Verifique se digitou corretamente ou aguarde a liberação.');
  }
});

// 🛡️ Token do bot (substitua pela sua chave real)
client.login(process.env.DISCORD_TOKEN);
