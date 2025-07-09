// 📦 Dependências necessárias
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const cron = require('node-cron');
const fs = require('fs');

// 🌐 Express para manter o Replit online
const app = express();
app.get('/', (req, res) => res.send('Bot rodando!'));
app.listen(3000, () => console.log('Servidor express ativo na porta 3000'));

// 📋 Carregar credenciais da conta de serviço
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(fs.readFileSync('credentials.json')), // <- salve o .json como 'credentials.json' no Replit
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
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
client.login('MTM4OTM1MDM0ODM3OTkxNDM2Mg.GYNgU5.yiHgU1Q8lD4qzdZtlB5PiAuDg9iQ9mKjWP10LU');