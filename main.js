const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const assets = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'LTCUSDT', 'LINKUSDT', 'BCHUSDT', 'XLMUSDT'];
let currentCapital = 100; // начальный капитал
let purchasedAmount = 0; // общее количество купленных активов
let purchasePrice = 0; // цена покупки

async function getCurrentPrice(asset) {
    try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}`);
        return parseFloat(response.data.price);
    } catch (error) {
        console.error("Не удалось получить данные о цене:", error);
        return null;
    }
}

//Покупаем актив на часть капитала
function buy(price) {
    const buyCapital = 10; // Используем 10 долларов для покупки
    const buyAmount = buyCapital / price; // Количество активов, которые мы можем купить на $10
    if (currentCapital >= buyCapital) {
        purchasedAmount += buyAmount;
        purchasePrice = price;
        currentCapital -= buyCapital;
        console.log(`Куплено ${buyAmount.toFixed(4)} активов по цене $${price} каждый. Оставшийся капитал: $${currentCapital.toFixed(2)}`);
    } else {
        console.log("Недостаточно средств для покупки.");
    }
}


//Продаем все купленные активы
function sell(price) {
    if (purchasedAmount > 0) {
        const sellAmount = purchasedAmount;
        purchasedAmount = 0;
        const sellValue = sellAmount * price;
        currentCapital += sellValue;
        const profit = (price - purchasePrice) * sellAmount;
        console.log(`Продано ${sellAmount.toFixed(4)} активов по цене $${price} каждый. Прибыль: $${profit.toFixed(2)}`);
    } else {
        console.log("Нет активов для продажи.");
    }
}

async function main() {
    console.log("Доступные активы:");
    assets.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset}`);
    });

    rl.question("Выберите номер актива для отображения цены: ", async (answer) => {
        const assetIndex = parseInt(answer) - 1;

        if (assetIndex >= 0 && assetIndex < assets.length) {
            const selectedAsset = assets[assetIndex];
            console.log(`Выбранный актив: ${selectedAsset}`);

            const currentPrice = await getCurrentPrice(selectedAsset);
            if (currentPrice) {
                console.log(`Текущая цена: $${currentPrice}`);

                rl.question("Введите процент изменения цены для совершения операции (например, 5 для 5%): ", async (answer) => {
                    const priceChangePercent = parseFloat(answer);
                    if (isNaN(priceChangePercent) || priceChangePercent <= 0) {
                        console.log("Ошибка: введите корректное значение процента.");
                        rl.close();
                        return;
                    }

                    console.log(`Программа будет ждать изменения цены на ${priceChangePercent}% для выполнения операции покупки или продажи.`);

                    let isWaitingForBuy = true;
                    let buyPrice = currentPrice;

                    while (true) {
                        const simulatedPriceChange = Math.random() * 2 - 1; // Симулируем изменение цены
                        const newPrice = buyPrice * (1 + simulatedPriceChange / 100); // Новая цена

                        if (isWaitingForBuy && newPrice < buyPrice * (1 - priceChangePercent / 100)) {
                            buy(newPrice); // Покупаем на $10
                            isWaitingForBuy = false;
                        } else if (!isWaitingForBuy && newPrice > buyPrice * (1 + priceChangePercent / 100)) {
                            sell(newPrice); // Продаем все купленные активы
                            isWaitingForBuy = true;
                        }

                        if (isWaitingForBuy) {
                            buyPrice = newPrice; // Обновляем цену для следующей покупки
                        }

                        console.log(`Текущая цена: $${newPrice.toFixed(2)}, Состояние счета: $${currentCapital.toFixed(2)}`);

                        // Завершение программы при недостатке капитала
                        if (currentCapital < 10) {
                            console.log("Недостаточно капитала для покупки. Завершение торговли.");
                            rl.close();
                            break;
                        }

                        await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза перед следующей итерацией
                    }
                });

            } else {
                console.log("Не удалось получить текущую цену.");
                rl.close();
            }
        } else {
            console.log("Неправильный номер актива. Попробуйте снова.");
            rl.close();
        }
    });
}

main();
