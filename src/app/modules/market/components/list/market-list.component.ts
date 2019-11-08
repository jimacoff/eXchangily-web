import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PriceService } from '../../../../services/price.service';
import { KanbanService } from '../../../../services/kanban.service';
import { WsService } from '../../services/ws.service';
import { Order, Price, Coin } from '../../../../interfaces/kanban.interface';

@Component({
    selector: 'app-market-list',
    templateUrl: './market-list.component.html',
    styleUrls: ['./market-list.component.css']
})

export class MarketListComponent implements OnInit {
    select = 0;
    prices: Price[] = [];
    tab_prices: Price[] = [];
    searchText = '';
    COINS: Coin[];
    constructor(private prServ: PriceService, private _router: Router, private _wsServ: WsService, private kanbanService: KanbanService) {
        
    }

    ngOnInit() {
        this.prices = this.prServ.getPriceList();
        this.COINS = this.prServ.getCoinList();
        this.selectCat(100);
        if (!this.tab_prices || this.tab_prices.length === 0) {
            this.selectCat(0);
        }

        this._wsServ.currentPrices.subscribe((arr: any) => {
            this.updateTickerList(arr);
        });
                
        this.kanbanService.getAllOrders().subscribe((orders: Order[]) => {
            console.log('orders from /exchangily/getAllOrderData');
            console.log(orders);
            for (let i = 0 ; i < orders.length; i++) {
                const order = orders[i];
                for (let j = 0; j < this.prices.length; j++) {
                    const price = this.prices[j];
                    if (price.base_id === order.baseCoin && price.coin_id === order.targetCoin) {
                        price.price = order.price;
                        price.vol24h = order.amount;
                    }
                }
            }

        });  
    }
        
    selectCat(cat: number) {
        this.select = cat;
        if (cat === 100) {
            this.tab_prices = this.prices.filter((listing: Price) => listing.favorite === 1);
        } else if (cat === 1000) {
            this.tab_prices = [];
        }
        {
            this.tab_prices = this.prices.filter((listing: Price) => listing.base_id === cat);
        }
        
    }
    
    search() {
        console.log('search begin', this.searchText);
        this.selectCat(1000);
        this.tab_prices = this.prices.filter((listing: Price) => listing.symbol.indexOf(this.searchText) >= 0);
    }
    gotoTrade(id: number) {
        const pair = this.COINS[this.prices[id].coin_id].name + '_' + this.COINS[this.prices[id].base_id].name;
        this._router.navigate(['market/trade/' + pair]);
    }

    toggleFavorite(price: Price) {
        console.log('price before toggle', price);
        console.log('price.favorite=', price.favorite);
        price.favorite = 1 - price.favorite;
        console.log('price.favorite=', price.favorite);
        console.log('price after toggle', price);
    }

    updateTickerList(arr) {
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            const s = item.symbol;
            const h = item['24h_high'] / 1e18;
            const price = item.price / 1e18;
            const l = item['24h_low'] / 1e18;
            let change24h = 0;
            const o = item['24h_open'] / 1e18;
            const c = item['24h_close'] / 1e18;
            if (o > 0) {
                change24h = (c - o) / o * 100;
            }
            const v = item['24h_volume'] / 1e18;

            for (let j = 0; j < this.tab_prices.length; j++) {
                const tabItem = this.tab_prices[j];
                const tabItemSymbol = this.COINS[tabItem.coin_id].name + this.COINS[tabItem.base_id].name;
                if (s === tabItemSymbol) { 
                    tabItem.change24h = change24h;
                    tabItem.price = price;
                    tabItem.price24hh = h;
                    tabItem.price24hl = l;
                    tabItem.vol24h = v;
                }
            }
        }
    }    
}
