import inquirer from 'inquirer'
import chalk from 'chalk'

import fs from 'fs'
import path from 'path'

const accountPath = 'accounts'
let definedPath = ''
let newAccountRegister = {
  balance: 0,
  active: true,
  history: [
    { info: 'Abertura da conta', amount: 0, balance: 0 }
  ]
}

// iniciar programa
function programStart() {
  verifyAccountsDir()

  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'O que deseja fazer?',
      choices: [
        'Criar Conta',
        'Visualizar Saldo',
        'Depositar',
        'Sacar',
        'Transferir entre Contas',
        'Extrato',
        'Encerrar Conta',
        'Sair'
      ]
    }
  ]).then(answer => {

    switch (answer['action']) {
      case 'Criar Conta': createAccount()
        break
      case 'Visualizar Saldo': retrieveAccountAmount()
        break
      case 'Depositar': depositAccount()
        break
      case 'Sacar': withdrawAccount()
        break
      case 'Transferir entre Contas': transferenceAccount()
        break
      case 'Extrato': retrieveAccountHistory()
        break
      case 'Encerrar Conta': closeAccount()
        break
      case 'Sair': finalizeProgram()
        break
    }

  })
}

function definePath(accountName) {
  definedPath = path.join(accountPath, `${accountName}.json`)
}

function verifyAccountsDir() {
  if (!fs.existsSync(accountPath)) {
    fs.mkdirSync(accountPath)
  }
}

function deleteAccount() {
  if (fs.existsSync(definedPath)) {
    fs.rmSync(definedPath)
  }
}

function verifyAccountExist() {
  if (fs.existsSync(definedPath)) return true

  return false
}

function defineAccountName() {

  return inquirer.prompt([
    {
      name: 'accountName',
      message: 'Digite o nome da conta:'
    }
  ])
}

function getAccount(accountName) {
  const account = fs.readFileSync(definedPath, { encoding: 'utf-8', flag: 'r' })
  return JSON.parse(account)
}

function saveAccount(accountRegister) {
  const register = accountRegister ? accountRegister : newAccountRegister

  fs.writeFileSync(definedPath, JSON.stringify(register), (err) => {
    console.log(err)
  })
}

function historyRegister(accountRegister, accTransfRec, accTransfSend) {

  const newHistory = { info: '', amount: 0 }
  const lastHistory = accountRegister.history[0]

  if (accTransfRec) {

    newHistory.info = `Transf. reb. ${accTransfRec}`
    newHistory.balance = accountRegister.balance
    newHistory.amount = accountRegister.balance - lastHistory.balance

  } else if (accTransfSend) {

    newHistory.info = `Transf. env. ${accTransfSend}`
    newHistory.balance = accountRegister.balance
    newHistory.amount = lastHistory.balance - accountRegister.balance

  } else if (lastHistory.amount > accountRegister.balance) {

    newHistory.info = 'Saque'
    newHistory.balance = accountRegister.balance
    newHistory.amount = lastHistory.amount - accountRegister.balance

  } else if (lastHistory.amount < accountRegister.balance) {

    newHistory.info = 'Depósito'
    newHistory.balance = accountRegister.balance
    newHistory.amount = accountRegister.balance - lastHistory.amount

  }

  accountRegister.history.unshift(newHistory)

}

function amountInfo(type) {
  let message = ''

  if (type === 'deposit') message = 'Informe o valor para depósito:'
  else if (type === 'withdraw') message = 'Informe o valor para retirada:'
  else if (type === 'transf') message = 'Informe o valor para transferência:'

  return inquirer.prompt([
    {
      name: 'amount',
      message
    }
  ])

}

// criar conta
function createAccount() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} já existe.\nTente Novamente!`))
      return createAccount()
    }

    saveAccount()

    console.log(chalk.bgGreen.bold.white(`Parabéns. Conta ${accountName} criada com sucesso!`))

    programStart()

  })

}

// visualizar saldo
function retrieveAccountAmount() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (!verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} não existe.\nTente novamente.`))
      return retrieveAccountAmount()
    }

    const account = getAccount(accountName)

    console.log(chalk.bgGreen.bold.white(`O saldo da conta ${accountName} é de R$${account.balance}`))

    programStart()

  })

}

// depositar
function depositAccount() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (!verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} não existe.\nTente Novamente!`))
      return depositAccount()
    }

    const account = getAccount(accountName)

    amountInfo('deposit').then(answer => {
      const amount = answer['amount']

      if (+amount <= 0) {
        console.log(chalk.bgRed.bold.white(`Operação inválida.\nInforme um valor maior que 0 (zero).\nTente Novamente!`))
        return depositAccount()
      }

      account.balance += +amount

      historyRegister(account)

      saveAccount(account)

      console.log(chalk.bgGreen.bold.white(`Depósito realizado na conta ${accountName}.\nSaldo atual de R$${account.balance}`))

      programStart()

    })

  })


}

// sacar
function withdrawAccount() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (!verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} não existe.\nTente Novamente!`))
      return withdrawAccount()
    }

    const account = getAccount(accountName)

    amountInfo('withdraw').then(answer => {
      const amount = answer['amount']

      if (+amount <= 0) {
        console.log(chalk.bgRed.bold.white(`Operação inválida.\nInforme um valor maior que 0 (zero).\nTente Novamente!`))
        return withdrawAccount()
      }

      if (account.balance < +amount) {
        console.log(chalk.bgRed.bold.white(`Operação inválida.\nA conta ${accountName} possui saldo de R$${account.balance}.\nTente Novamente!`))
        return withdrawAccount()
      }

      account.balance -= +amount

      historyRegister(account)

      saveAccount(account)

      console.log(chalk.bgGreen.bold.white(`Saque realizado na conta ${accountName}.\nSaldo atual de R$${account.balance}`))

      programStart()

    })

  })

}

// transferir entre contas
function transferenceAccount() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (!verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} não existe.\nTente Novamente!`))
      return transferenceAccount()
    }

    const account = getAccount(accountName)

    amountInfo('transf').then(answer => {
      const amount = answer['amount']

      if (+amount <= 0) {
        console.log(chalk.bgRed.bold.white(`Operação inválida.\nInforme um valor maior que 0 (zero).\nTente Novamente!`))
        return transferenceAccount()
      }

      if (account.balance < +amount) {
        console.log(chalk.bgRed.bold.white(`Operação inválida.\nA conta ${accountName} possui saldo de R$${account.balance}.\nTente Novamente!`))
        return transferenceAccount()
      }

      defineAccountName().then(answer => {
        const accountNameTransf = answer['accountName'].toLowerCase().trim()

        definePath(accountNameTransf)

        if (!verifyAccountExist()) {
          console.log(chalk.bgRed.bold.white(`A conta ${accountNameTransf} de destino não existe.\nTente Novamente!`))
          return programStart()
        }

        const accountSend = getAccount(accountNameTransf)

        accountSend.balance += +amount
        historyRegister(accountSend, accountName)
        saveAccount(accountSend)

        definePath(accountName)
        account.balance -= +amount
        historyRegister(account, null, accountNameTransf)
        saveAccount(account)

        console.log(chalk.bgGreen.bold.white(`Transferência realizada da conta ${accountName} para ${accountNameTransf} no valor de ${amount}.\nSaldo atual de R$${account.balance}`))

        programStart()

      })

    })

  })

}

// extrato
function retrieveAccountHistory() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (!verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} não existe.\nTente Novamente!`))
      return retrieveAccountHistory()
    }

    const account = getAccount(accountName)

    console.log(chalk.bgGreen.bold.white(`O saldo da conta ${accountName} é de R$${account.balance}`))
    console.table(account.history)

    programStart()

  })

}

// encerrar conta
function closeAccount() {

  defineAccountName().then(answer => {
    const accountName = answer['accountName'].toLowerCase().trim()

    definePath(accountName)

    if (!verifyAccountExist()) {
      console.log(chalk.bgRed.bold.white(`A conta ${accountName} não existe.\nTente Novamente!`))
      return closeAccount()
    }

    const account = getAccount(accountName)

    if (account.balance > 0) {
      const balance = account.balance

      console.log(chalk.bgYellow.bold('O encerramento da conta exige o saque total do saldo da conta'))

      account.balance = 0

      historyRegister(account)

      console.log(chalk.bgGreen.bold(`Saque da conta ${accountName} no valor de ${balance} realizado com sucesso!`))

    }

    console.log(chalk.bgGreen.bold(`Conta ${accountName} encerrada com sucesso!`))
    console.table(account.history)

    deleteAccount()

    programStart()

  })
}


// sair
function finalizeProgram() {
  console.log(chalk.bgGreen.bold.white('Obrigado por confiar no SuperBank!'))
  process.exit()
}

programStart()