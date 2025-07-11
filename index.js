// 📦 Dependências necessárias
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const cron = require('node-cron');

// 🌐 Express para manter o Replit online
const app = express();
app.get('/', (req, res) => res.send('Bot rodando!'));
app.listen(3000, () => console.log('Servidor express ativo na porta 3000'));

// 🔐 Credenciais diretamente no código (evite em produção)
const credentials = {
  type: "service_account",
  project_id: "bot-discord-validacao",
  private_key_id: "4662ac5288b01808cc1773b2135f8b858679cdd3",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDCjKcTdkjvNXwT
NxkoJhIj5wrdIFWp/HceP3uxgNkCPTPfuc6N9QyyTeqgf1IzemAM9owP75fduh1L
NrNXXKPRViWSnTdRyRWAKKnUDIu9Me+m419PaTFHnEedg6C1cCk9bdpsBtLSgfe2
GMuOYALixXuJWDwz4P1C28+HELXbqebCczGoTC2Gi4Vt6CHU3eDOVusJD2bill/2
iChDObRkFCSy+q35XgOla5dY5tvp+fAtVAt2f4wi7FvmX+LOJ7p+xGTwnzQyhuVq
BCH+rfFmvmH2ZSUrgWPCHYwVBHhnYyYoHpieszoHja4xlZRdmySuOpWwhlesVzil
bwwEMjXhAgMBAAECggEACV0QKIdjpMG3/kvDVfOZIWm8E977yIHqcMYA687mAu3T
qpOsjZgK+6T04zMlj203JMCUBqtTLZyIzucr1AtVJhzlk4wmDrVlJ8UtQVO2QQ2f
eXKNkoqfUNFEgCAG8tyaW4bHQbZFXNTdCYJhf7F+yg/TrY1V3nBYeCiQsTE8c31B
LmriMENcRBxz0DDdn7WxSqG6+Ue0fpwZl2ItomX3GfH+ptO0e8zEsOCDQwJOQ50S
zFJotcnkpDpFNqqHWMgnjd5KzN/pBU1+42IvV5adgU0QQ86PNiq23nMRUNOe9Okx
YZy6XhCBIa+JntQnIigQNJwx9etotR81Lkdi6Sip7QKBgQDhvMiiqkzQ5PRinihn
wc4ABPOX+0a5Ex2pXvjsiCj/Og/T05klgbm5UyrcMSabH3I/jjLBOZeNCDLrtXwJ
am8SjlaJc4HWorFY5yzDPk5Xb95B9rsXGZm4OaIt73bCBMcE3hT9+Wm6GiFwgcVV
DNgteUHIzhg1YZy6Fs2Bbz3kVQKBgQDcoYJVwyHKr9tbfYoN6C8F87tLLjFk4fK4
tBsm/PBn6CCNRTVQ6abOmdHa04qqQ/q4udCiYd3L14KuGebpdFGI6e2xB0C4I8nD
30wZ2C1bCAPZuW8r8Fnme5pURiUDTWUEzCYiM0RpSd76Eh32H9ODZbd7FfpEatWT
zU04fAg3XQKBgFHlC2T4I6YlagPdHQuHZBTdtwIMRzwdk0U/D0/Alh8CEXvn6EeT
KK3zXjlEG51raydjj0ZKfpDLyK16yeUgl+tDeGGlZhVYML7wH201zXYrP5buzDE1
OG99eTjxB0ScNxes+jCpq5G4qSkH629PmZ3lv9f57Q5wu0tHuoaatPmBAoGAH6Uq
xJJQbnn6xIylGImM9RWYb5gYjZe68LMkkdsFwGGTCbA7jXd17XwylWhyIynM9GHy
gtf2sB4hKEeezy1X5INpDFM1/TNk5StKBwrytnPX2Yq3X14CBwUDhcLp3CdlreJ6
Nb2UumVWDhg7I+o8tEQKpSTp2JZaO/DeepOPuiECgYBGfmdryI7SW0aPnkYxujDL
P+hyt0qHGnYNmDv6uEpDp5Dxy7fe2n0JBY72U3speWnYoDBMsalfxCQTkOQZ78CS
iPMu3UWzu34mPQxlq7pqWHsnNY/1SZfkgJAnIcyPVtI/X7X9RViqr73KUrVoPg6G
TbCoBcQHKHh4ts/I5BgVHg==
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
console.log("TOKEN LIDO:", process.env.DISCORD_TOKEN);
client.login(process.env.DISCORD_TOKEN);
