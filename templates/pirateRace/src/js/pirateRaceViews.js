define("pirateRaceViews", ["jquery", "backbone", "components", "handlebars", "cssUtils", "templates", "jquery.fastbutton"], function($, Backbone, Components, Handlebars, CssUtils) {

	//
	// grunt-rigger directive - DO NOT DELETE
	//= handlebars-templates
    //


    var transitionend = CssUtils.getTransitionendEvent();


    // Define view types

    var getTemplate = Handlebars.getTemplate,
        SingleUseVirtualGoodView = Components.SingleUseItemView.extend({ template : getTemplate("item") }),
        SectionedListView = Components.BaseCompositeView.extend({
            className           : "items virtualGoods",
            template            : getTemplate("listContainer"),
            itemViewContainer   : ".container",
            initialize : function() {
                this.listenTo(this.model, "change:name", this.render);
            },
            getItemView: function(item) {

                if (!item) {
                    return Components.BaseCompositeView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    // some logic to calculate which view to return
                    switch (item.get("type")) {
                        case "singleUse":
                            itemView = SingleUseVirtualGoodView;
                            break;
                        case "equippable":
                            itemView = EquippableVirtualGoodView;
                            break;
                        case "lifetime":
                            itemView = LifetimeVirtualGoodView;
                            break;
                    }
                    return itemView;
                }
            }
        }),
        EquippableVirtualGoodView   = Components.EquippableItemView.extend({ template : getTemplate("equippableItem")}),
        LifetimeVirtualGoodView     = Components.LifetimeItemView.extend({ template : getTemplate("equippableItem")}),
        CurrencyPackView            = Components.CurrencyPackView.extend({ template : getTemplate("currencyPack"), triggers : {fastclick : "buy"} }),
        NonConsumableView           = Components.BuyOnceItemView.extend({template : getTemplate("nonConsumableItem") }),
        RestorePurchasesView        = Components.LinkView.extend({
            tagName: "div",
            template: getTemplate("restorePurchases")
        });


    var extendViews = function(model) {

        var theme = model.get("theme");

        // Add template helpers to view prototypes

        var templateHelpers = function() {
            // add the animation work only while adding virtual currencies or goods
            if(this.initialized){
                var that = this;
                setTimeout(function(){
                    that.$el.addClass("changed");
                    var balanceEl = that.$el.find(".balanceWrap > div");
                    balanceEl.one(transitionend, function(){
                        that.$el.removeClass("changed");
                    });
                }, 200)
            }
            this.initialized = true;
            var modelAssets = model.getModelAssets();
            return _.extend({
                imgFilePath : modelAssets.items[this.model.id] || this._imagePlaceholder,
                currency : {
                    imgFilePath : modelAssets.items[this.model.getCurrencyId()] || this._imagePlaceholder
                },
                price : this.model.getPrice(),
                itemSeparator       : theme.itemSeparator

                // TODO: Move all properties under pages.goods.item and pages.currencyPacks.item and migrate DB

            }, theme.pages.goods.listItem);
        };


        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        LifetimeVirtualGoodView.prototype.templateHelpers   = templateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return {
                price           : this.model.getPrice(),
                nameStyle       : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle      : theme.pages.currencyPacks.listItem.priceStyle,
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : modelAssets.items[this.model.id] || this._imagePlaceholder
            };
        };
        NonConsumableView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return {
                nameStyle           : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle          : theme.pages.currencyPacks.listItem.priceStyle,
                itemSeparator       : theme.itemSeparator,
                ownedIndicatorImage : theme.common.ownedIndicatorImage,
                imgFilePath         : modelAssets.items[this.model.id] || this._imagePlaceholder
            };
        };

        RestorePurchasesView.prototype.templateHelpers = function() {
            return {
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : theme.common.restorePurchasesImage
            };
        }
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showCurrencyPacks", "showGoodsStore", "buyItem", "equipGoods", "restorePurchase");

            // Initialize dialog metadata
            this.dialogModal = this.theme.pages.goods.noFundsModal;
            this.messageDialogOptions = {
                background 	: this.dialogModal.background,
                textStyle 	: this.dialogModal.textStyle
            };
            this.loadingModal = _.extend({text : "Loading..."}, this.messageDialogOptions);


            this.categoryViews      = new Backbone.ChildViewContainer();
            this.currencyPacksViews = new Backbone.ChildViewContainer();

            var currencies          = this.model.getCurrencies(),
                categories          = this.model.getCategories(),
                nonConsumables      = this.model.get("nonConsumables");


            // Create category views
            categories.each(this.addCategoryView, this);
            categories.on({
                add : function(category) {
                    this.addCategoryView(category, {render : true});
                },
                remove : this.removeCategoryView
            }, this);

            // Create currency views
            currencies.each(this.addCurrencyView, this);
            currencies.on({
                add : function(currency) {
                    this.addCurrencyView(currency, {render : true});
                },
                remove : this.removeCurrencyView
            }, this);

            this.nonConsumablesView = new Components.CollectionView({
                className           : "items nonConsumables",
                collection          : nonConsumables,
                itemView            : NonConsumableView
            }).on("itemview:buy", this.buyItem);


            // Add restore purchases view if necessary
            if (!nonConsumables.isEmpty()) {
                this.restorePurchasesView = new RestorePurchasesView().on("select", this.restorePurchase);
            }

        },
        events : {
            "fastclick      .leave-store"   : "leaveStore",
            "fastclick      .buy-more"      : "onClickBuyMore",
            "fastclick      .back"          : "showGoodsStore"
        },
        ui : {
            goodsStore              : "#goods-store",
            currencyStore           : "#currency-store",
            backButton              : "#goods-store .btn1",
            goodsIscrollContainer   : "#goods-store .items-container [data-iscroll='true']",
            currencyPacksContainer  : "#currency-store .currency-packs"
        },
        emulateActiveElements : ".btn1,.btn2", // Valid jQuery selector
        updateBalance : function(model) {
            // TODO: Move to a header view
            
            var that = this;
            // make it happen only when you add to balance
            if(model.previous("balance")<model.get("balance")){
                that.$(".balance-container label").addClass("changed");
                setTimeout(function(){
                    that.$(".balance-container label").removeClass("changed");
                }, 1000)
            }
            that.$(".balance-container label").html(model.get("balance"));
        },
        onClickBuyMore: function () {
            this.playSound().showCurrencyPacks();
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var currency = this.model.getCurrency(itemId);
            if (currency) {
                this.showCurrencyPacks();
                return;
            }

            var currencyPacksItem = this.model.packsMap[itemId];
            if (currencyPacksItem) {
                this.showCurrencyPacks();
                this.currencyPacksViews.each(function (currencyPackView) {
                    var itemView = currencyPackView.children.findByModel(currencyPacksItem);
                    if (itemView) {
                        this.iscrolls.packs.scrollToElement(itemView.el, 500);
                        return;
                    }
                }, this);
                return;
            }

            var nonConsumableItem = this.model.get("nonConsumables").get(itemId);
            if (nonConsumableItem) {
                this.showCurrencyPacks();
                var itemView = this.nonConsumablesView.children.findByModel(nonConsumableItem);
                if (itemView) {
                    this.iscrolls.packs.scrollToElement(itemView.el, 500);
                }
                return;
            }


            var category = this.model.getCategory(itemId);
            if (category) {
                this.showGoodsStore();
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (goodsItem) {
                this.showGoodsStore();
                this.categoryViews.each(function (categoryView) {
                    var itemView = categoryView.children.findByModel(goodsItem);
                    if (itemView) {
                        this.iscrolls.goods.scrollToElement(itemView.el, 500);
                        return;
                    }
                }, this);
                return;
            }

            console.log('View was not changed. Could not find item: "' + itemId + '".');
        },
        changeActiveViewByModel: function (model) {
            this.changeViewToItem(model.id);
        },
        showCurrencyPacks : function() {

            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").get("name") + " is unavailable. Check your internet connectivity and try again.");
            } else {
                var that = this;
                that.ui.currencyStore.removeClass("hide");
                that.ui.currencyStore.removeClass("showBtn");
                that.ui.currencyStore.addClass("on");
                
                that.ui.currencyStore.one(transitionend, function(){
                    that.ui.goodsStore.removeClass("showBtn");
                    that.ui.currencyStore.addClass("showBtn");
                    that.iscrolls.packs.refresh();
                });
                /*
                this.ui.goodsStore.hide();
                this.ui.currencyStore.show();
                this.iscrolls.packs.refresh();
                */
            }
        },
        showGoodsStore : function() {
            var that = this;
            that.playSound();

            that.ui.currencyStore.addClass("hide");
            that.ui.currencyStore.one(transitionend, function(){
                that.ui.currencyStore.removeClass("on");
                that.ui.goodsStore.addClass("showBtn");
                that.iscrolls.goods.refresh();
            });

            //this.ui.currencyStore.hide();
            //this.ui.goodsStore.show();
            //that.iscrolls.goods.refresh();
        },
        iscrollRegions : {
            goods : {
                el : "#goods-store .items-container",
                options : {hScroll: false, vScrollbar: false}
            },
            packs : {
                el : "#currency-store .items-container",
                options : {hScroll: false, vScrollbar: false}
            }
        },
        onRender : function() {
            //this.ui.currencyStore.hide();
            //this.ui.goodsStore.addClass("showBtn");

            // Render subviews (items in goods store and currency store)
            this.categoryViews.each(this.appendCategoryView, this);
            this.currencyPacksViews.each(this.appendCurrencyView, this);

            this.$("#currency-store .non-consumables").html(this.nonConsumablesView.render().el);

            if (this.restorePurchasesView) {
                this.$("#restore-purchases").html(this.restorePurchasesView.render().el);
            }
            var that = this;
            setTimeout(function(){
                that.ui.goodsStore.addClass("showBtn");
            }, 200);

            this.ui.backButton.one(transitionend, function() {
                that.iscrolls.goods.refresh();
            });
        },
        appendCategoryView : function(view) {
            this.ui.goodsIscrollContainer.append(view.render().el);

            // The iscrolls exist only after initial rendering is complete
            if (this.iscrolls) this.iscrolls.goods.refresh();
        },
        appendCurrencyView : function(view) {
            this.ui.currencyPacksContainer.append(view.render().el);

            // The iscrolls exist only after initial rendering is complete
            if (this.iscrolls) this.iscrolls.packs.refresh();
        },
        buyItem : function (view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        equipGoods : function (view) {
            this.playSound().wantsToEquipGoods(view.model);
        },
        restorePurchase : function () {
            this.playSound().wantsToRestorePurchases();
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 640) : (innerHeight / 960);
        },


        //
        // Functions for supporting external addition and removal of
        // categories and currencies.  Use by dashboard.
        //

        addCategoryView : function(category, options) {

            var goods = category.get("goods");
            var view = new SectionedListView({
                model 				: category,
                collection          : goods,
                templateHelpers     : this.theme.categories
            }).on({
                "itemview:buy" 		: this.buyItem,
                "itemview:equip" 	: this.equipGoods
            });

            this.categoryViews.add(view, category.id);

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCategoryView(view);

            this.listenTo(goods, "add remove", function() {
                this.iscrolls.goods.refresh();
            }, this);
        },
        addCurrencyView : function(currency, options) {
            var packs = currency.get("packs");
            var view = new Components.CollectionView({
                className           : "items currencyPacks",
                collection          : packs,
                itemView            : CurrencyPackView
            }).on("itemview:buy", this.buyItem);

            this.currencyPacksViews.add(view, currency.id);

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCurrencyView(view);

            this.listenTo(packs, "add remove", function() {
                this.iscrolls.packs.refresh();
            }, this);
        },
        removeCategoryView : function(category) {
            var view = this.categoryViews.findByCustom(category.id);
            view.close();
            this.categoryViews.remove(view);
            this.iscrolls.goods.refresh();
        },
        removeCurrencyView : function(currency) {
            var view = this.currencyPacksViews.findByCustom(currency.id);
            view.close();
            this.currencyPacksViews.remove(view);
            this.iscrolls.packs.refresh();
        }
    });
    StoreView.mixinActiveTouchEmulation();

    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});
