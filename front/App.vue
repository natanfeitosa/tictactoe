<template>
  <div class="bg-white p-8 rounded-lg shadow-md w-96 m-2">
    <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Jogo da Velha</h1>
    <div v-if="connected" class="mb-4 text-center text-green-600">Conectado ao servidor</div>
    <div v-else class="mb-4 text-center text-red-600">Desconectado do servidor</div>
    <button v-if="!connected" @click="startGame"
      class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4">
      Entrar em uma partida
    </button>
    <template v-else>
      <div v-if="roomId" class="mb-4 text-center text-blue-600">
        Partida: {{ roomId }}
      </div>
      <div v-if="waitingForOpponent" class="text-center mb-4 text-yellow-600">
        Aguardando oponente...
      </div>
      <template v-else>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button v-for="(cell, index) in gameState.board" :key="index" @click="makeMove(index)"
            :disabled="cell !== null || gameState.winner !== null"
            class="w-24 h-24 bg-gray-200 hover:bg-gray-300 text-4xl font-bold flex items-center justify-center rounded disabled:opacity-50">
            {{ cell }}
          </button>
        </div>
        <div v-if="gameState.winner" class="text-center mb-4">
          <span v-if="gameState.winner === 'draw'" class="text-yellow-600 font-bold text-xl">Empate!</span>
          <span v-else-if="gameState.winner === mySymbol" class="text-green-600 font-bold text-xl">Você venceu!</span>
          <span v-else class="text-red-600 font-bold text-xl">Você perdeu!</span>
        </div>
        <div v-else class="text-center mb-4">
          <span class="text-blue-600 font-bold">{{ gameState.currentPlayer != mySymbol ? `Vez do jogador:
            ${gameState.currentPlayer}` : 'Sua vez' }}</span>
        </div>
        <button @click="resetGame" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Reiniciar Jogo
        </button>
      </template>
    </template>
  </div>
  <ConfirmDialog v-model="showDialog" title="Reiniciar" message="Seu oponente deseja reiniciar o jogo, aceita?"
    @confirm="onConfirm" @cancel="onCancel" />

  <AlertDialog v-model="showAlert" title="Rejeitado"
    message="Infelizmente seu oponente decidiu rejeitar, mas você ainda pode atualizar a página e tentar um novo jogo" @close="alert" />
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import AlertDialog from './components/AlertDialog.vue'

const showDialog = ref(false)
const showAlert = ref(false)
const connected = ref(false)
const roomId = ref(null)
const waitingForOpponent = ref(false)
const mySymbol = ref<string | null>(null)
const gameState = reactive({
  board: Array(9).fill(null),
  currentPlayer: 'X',
  winner: null
})

let socket: WebSocket | undefined;

function connectWebSocket() {
  let ws = new URL(`http://localhost:${import.meta.env.VITE_BACK_PORT}/game`)

  if (import.meta.env.PROD) {
    ws = new URL('/game', location.href)
  }
  ws.protocol = ws.protocol.replace('http', 'ws')

  socket = new WebSocket(ws)

  socket.onopen = () => {
    connected.value = true
    socket!.send(JSON.stringify({ type: 'join' }))
    waitingForOpponent.value = true
  }

  socket.onmessage = (event) => {
    const { type, ...payload } = JSON.parse(event.data)

    switch (type) {
      case 'roomJoined':
        roomId.value = payload.roomId
        return
      case 'gameStart':
        waitingForOpponent.value = false
        return
      case 'state':
        Object.assign(gameState, payload.state)
        return
      case 'opponentLeft':
        alert('Seu oponente abandonou o jogo.')
        waitingForOpponent.value = true
        return
      case 'user-info':
        mySymbol.value = payload.symbol
        return
      case 'wanna-reset':
        showDialog.value = true
        return
      case 'game-reset-rejected':
        showAlert.value = true
        return
      default:
        console.log({ type, payload })
        return
    }
  }

  socket.onclose = () => {
    connected.value = false
    roomId.value = null
    waitingForOpponent.value = false
  }
}

function startGame() {
  if (!connected.value) {
    connectWebSocket()
  }
}

function makeMove(index: number) {
  send('move', { roomId: roomId.value, index })
}

function resetGame() {
  send('reset', { roomId: roomId.value })
}

function send(type: string, data: {}) {
  if (socket && socket.readyState === WebSocket.OPEN && roomId.value) {
    socket.send(JSON.stringify({ type, ...data }))
  }
}

function onConfirm() {
  send('reset-confirmation', { wanna: true, roomId: roomId.value })
}

function onCancel() {
  send('reset-confirmation', { wanna: false, roomId: roomId.value })
}
</script>