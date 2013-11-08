define("pirateRaceViews", ["jquery", "backbone", "components", "handlebars", "cssUtils", "templates", "jquery.fastbutton", "jqueryUtils"], function($, Backbone, Components, Handlebars, CssUtils) {

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
                    switch (item.getType()) {
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
        OfferItemView               = Components.OfferItemView.extend({ template : getTemplate("offer") }),
        OffersCollectionView        = Components.CollectionView.extend({ template : getTemplate("collection"), itemView : OfferItemView });


    var extendViews = function(model) {

        var theme       = model.assets.theme,
            assets      = model.assets;

        // Add template helpers to view prototypes

        var templateHelpers = function() {
            // add the animation work only while adding virtual currencies or goods
            // TODO: Clean up this shit! it should use the ItemView's balance animation mechanism with classes
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
            return _.extend({
                imgFilePath : assets.getItemAsset(this.model.id),
                currency : {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                },
                price : this.model.getPrice(),
                itemSeparator       : theme.itemSeparator,
                isMarketPurchaseType : this.model.isMarketPurchaseType()

                // TODO: Move all properties under pages.goods.item and pages.currencyPacks.item and migrate DB

            }, theme.pages.goods.listItem);
        };


        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        LifetimeVirtualGoodView.prototype.templateHelpers   = templateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            return {
                price           : this.model.getPrice(),
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : assets.getItemAsset(this.model.id)
            };
        };
        OfferItemView.prototype.templateHelpers = function() {
            return {
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : assets.getHookAsset(this.model.id)
            };
        };
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showCurrencyPacks", "showGoodsStore", "buyItem", "equipGoods");

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
                offers              = this.model.getOfferHooks();


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


            if (!offers.isEmpty()) {

                // Add offer items
                this.addOffersView(offers);

                // Listen to offer changes
                this.listenTo(offers, {
                    add : function() {
                        if (offers.size() === 1) {
                            this.addOffersView(offers, {render : true});
                            this.iscrolls.packs.refresh();
                        }
                    },
                    remove : function() {
                        if (offers.isEmpty()) this.removeOffersView();
                        this.iscrolls.packs.refresh();

                    }
                });
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
            currencyPacksContainer  : "#currency-store .currency-packs",
            offersContainer         : "#offers-container"
        },
        emulateActiveElements : ".btn1,.btn2", // Valid jQuery selector
        _getBalanceHolder : function(currency) {
            return this.$(".balance-container label[data-currency='" + currency.id + "']");
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
            this.ui.currencyStore.removeClass("hide showBtn");

            this.ui.currencyStore.transitionOnce({klass : "on", remove : false}).done(_.bind(function(){
                this.ui.goodsStore.removeClass("showBtn");
                this.ui.currencyStore.addClass("showBtn");
                this.iscrolls.packs.refresh();
            }, this));
        },
        showGoodsStore : function() {
            this.playSound();

            this.ui.currencyStore.transitionOnce({klass : "hide", remove : false}).done(_.bind(function(){
                this.ui.currencyStore.removeClass("on");
                this.ui.goodsStore.addClass("showBtn");
                this.iscrolls.goods.refresh();
            }, this));
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

            // Append offers
            if (this.offersView) this.appendOffersView(this.offersView);

            var _this = this;
            setTimeout(function(){
                _this.ui.goodsStore.addClass("showBtn");
            }, 200);

            this.ui.backButton.one(transitionend, function() {
                _this.iscrolls.goods.refresh();
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
        appendOffersView : function(view) {
            this.ui.offersContainer.append(view.render().el);
            if (this.iscrolls) this.iscrolls.packs.refresh();
        },
        buyItem : function (view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        equipGoods : function (view) {
            this.playSound().wantsToEquipGoods(view.model);
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 640) : (innerHeight / 960);
        },


        //
        // Functions for supporting external addition and removal of
        // categories and currencies.  Use by dashboard.
        //

        addCategoryView : function(category, options) {

            var goods = category.getGoods();
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
            var packs = currency.getPacks();
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
        addOffersView : function(offers, options) {
            this.offersView = new OffersCollectionView({
                className   : "items offers",
                collection  : offers
            }).on("itemview:select", function(view) {
                this.wantsToOpenOffer(view.model);
            }, this);


            // If the `render` flag is provided, i.e. an offer
            // was externally added, render it!
            if (options && options.render === true) this.appendOffersView(this.offersView);
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
        },
        removeOffersView : function() {
            this.offersView.close();
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
