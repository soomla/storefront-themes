define("pirateRaceLandscapeViews", ["jquery", "backbone", "marionette", "components", "handlebars", "templates", "jquery.fastbutton"], function($, Backbone, Marionette, Components, Handlebars) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    // Define view types

    var getTemplate = Handlebars.getTemplate,

    // TODO: Expand to single use, equippable, lifetime, upgradable
        VirtualGoodView = Components.SingleUseItemView.extend({
            template : getTemplate("item"),
            onRender : function() {

                // Save the model cid for the iscroll to identify it
                this.$el.data("cid", this.model.cid);
            }
        }),
        MenuItemView = Components.LinkView.extend({
            tagName: "a",
            className : "menu-item",
            template: getTemplate("menuItem"),
            triggers: { fastclick: "select" },
            select : function() {
                this.$el.addClass("selected");
            },
            deselect : function() {
                this.$el.removeClass("selected");
            }
        }),

        MenuSectionView = Components.CollectionView.extend({
            "className" : "menu-section",
            tagName : "div",
            itemView : MenuItemView
        }),

    // TODO: Add template helpers
        MenuView = Marionette.Layout.extend({
            id : "menu",
            initialize : function(options) {

                _.extend(this, options.collections);

                this.categoriesView = new MenuSectionView({collection : this.categories}).forwardEvent("itemview:select", this, "select:category");
                this.currenciesView = new MenuSectionView({collection : this.currencies}).forwardEvent("itemview:select", this, "select:currency");

                var updateActiveView = function () {

                    // When changes occur to the categories \ currencies
                    // default to activating the first view in the menu
                    var view = this.categoriesView.children.first() || this.currenciesView.children.first();
                    this._replaceActiveView(view);
                };

                this.listenTo(this.categories, "add remove reset", updateActiveView);
                this.listenTo(this.currencies, "add remove reset", updateActiveView);

                // TODO: Mark selected category \ currency
                // TODO: Add offers
            },
            template : getTemplate("menu"),
            regions : {
                categoriesRegion : "#menu-categories-region",
                currenciesRegion : "#menu-currencies-region"
            },
            onRender : function() {
                this.categoriesRegion.show(this.categoriesView);
                this.currenciesRegion.show(this.currenciesView);
                this.activeView = this.categoriesView.children.first() || this.currenciesView.children.first();
                this.activeView.select();
            },
            setActiveViewByCid : function(modelCid) {

                var cid;
                this.categories.each(function(category) {
                    if (category.getGoods().get(modelCid)) cid = category.cid;
                });
                this.currencies.each(function(currency) {
                    if (currency.getPacks().get(modelCid)) cid = currency.cid;
                });


                var view = this.categoriesView.children.findByModelCid(cid) || this.currenciesView.children.findByModelCid(cid);
                this._replaceActiveView(view);
            },
            _replaceActiveView : function(view) {
                this.activeView.deselect();
                this.activeView = view;
                this.activeView.select();
            }
        }),



        CurrencyPackView = Components.CurrencyPackView.extend({
            template: getTemplate("currencyPack"),
            onRender : function() {

                // Save the model cid for the iscroll to identify it
                this.$el.data("cid", this.model.cid);
            }
        }),
        CurrencyView = Components.CollectionView.extend({
            className   : "currency", // clearfix
            itemView    : CurrencyPackView
        }),
        CategoryView = Components.CollectionView.extend({
            className   : "category", // clearfix
            getItemView: function(item) {

                if (!item) {
                    return Components.BaseCompositeView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    if (item.is("upgradable")) {
                        itemView = VirtualGoodView;
                    } else {

                        // some logic to calculate which view to return
                        switch (item.getType()) {
                            case "singleUse":
                                itemView = VirtualGoodView;
                                break;
                            case "equippable":
                                itemView = VirtualGoodView;
                                break;
                            case "lifetime":
                                itemView = VirtualGoodView;
                                break;
                        }
                    }
                    return itemView;
                }
            }
        }),

        // TODO: Change class name and allow float left
        CurrenciesView              = Components.CollectionView.extend({ tagName : "div", className: "currencies", itemView : CurrencyView }),
        CategoriesView              = Components.CollectionView.extend({ tagName : "div", className: "categories", itemView : CategoryView }),
        EquippableVirtualGoodView   = Components.EquippableItemView.extend({ template : getTemplate("equippableItem")});


    var extendViews = function(model) {

        var theme = model.assets.theme;
        var assets = model.assets;


        // Add template helpers to view prototypes

        var templateHelpers = function() {

            return _.extend({
                imgFilePath: assets.getItemAsset(this.model.id),
                currency : {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                },
                price : this.model.getPrice()

            }, theme.goods.item);
        };

        VirtualGoodView.prototype.templateHelpers = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        CurrencyPackView.prototype.templateHelpers = function() {
            return _.extend({
                price : this.model.getPrice(),
                imgFilePath     : assets.getItemAsset(this.model.id),
                currency : {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                }
            }, theme.currencyPacks.item);
        };
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {


            _.bindAll(this, "chooseCategory", "chooseCurrencyCategory", "buyItem", "equipGoods");



            this.dialogModal = this.theme.noFundsModal;
            this.loadingModal = {
                "text": "Loading...",
                "background": this.dialogModal.background,
                "textStyle": this.dialogModal.textStyle
            };


            var currencies      = this.model.getCurrencies(),
                categories      = this.model.getCategories();

            // Create header view
            this.headerView = new MenuView({
                collections : {
                    categories : categories,
                    currencies : currencies
                    // TODO: Add offers
                }
            });
            this.listenTo(this.headerView, {
                "select:category" : this.chooseCategory,
                "select:currency" : this.chooseCurrencyCategory
            });

            // Create category views
            this.createCategoriesView(categories);

            // Create currency views
            this.createCurrenciesView(currencies);
        },
        events : {
            "fastclick #leave-store" : "leaveStore",
            "fastclick .buy-more"    : "onClickBuyMore"
        },
        ui : {
            goodsIscrollContainer   : "#items-container [data-iscroll='true']",
            menuRegion              : "#menu-region"
        },
        updateBalance : function(model) {
            // TODO: Move to a header view
            this.$(".balances label[data-currency='" + model.id + "']").html(model.getBalance());
        },
        onClickBuyMore : function() {
            this.showCurrencyPacks();
        },
        changeViewToItem: function (itemId) {
            if (!itemId) return;

            var category = this.model.categoryMap[itemId];
            var item, view;

            if (category) {
                item = category.getGoods().get(itemId);
                view = this.categoriesView.children.findByModel(category).children.findByModel(item);
            } else {
                if (item = this.model.packsMap[itemId]) {
                    var currency = this.model.getCurrency(item.getCurrencyId());
                    view = this.currenciesView.children.findByModel(currency).children.findByModel(item);
                }
            }

            if (view) {
                this.iscrolls.onlyOne.scrollToElement(view.el, 500);
            } else {
                console.log('View was not changed. Could not find item: "' + itemId + '".');
            }
        },
        changeActiveViewByModel : function(model) {
            var view = this.categoriesView.children.findByModel(model) || this.currenciesView.children.findByModel(model);
            if (view) this.iscrolls.onlyOne.scrollToElement(view.el, 500);
        },
        showCurrencyPacks: function () {
            var view = this.currenciesView.children.first();
            this.iscrolls.onlyOne.scrollToElement(view.el, 500);
        },
        iscrollRegions : {
            onlyOne : {
                el : "#items-container",
                options: {
                    snap: 'li',
                    hScroll: true, vScroll: false, hScrollbar: false, vScrollbar: false,
                    onScrollEnd: function ($this, iScroll) {
                         var itemWidth = $this.$(".item:first").outerWidth(true);
                        var xPos = Math.max(0, (Math.abs(iScroll.x)));
//                        if (Math.abs(iScroll.x) > Math.abs(iScroll.maxScrollX) - 1) {
//                            // Handle the edge case of getting to the end of the scroller.
//                            xPos = iScroll.scroller.clientWidth - 1;
//                        }
                        var itemIndex = Math.ceil(xPos / itemWidth);
                        var liElement = $('ul li', iScroll.scroller).eq(itemIndex);
                        var categoryId = liElement.data('cid');

                        $this.headerView.setActiveViewByCid(categoryId);
                    }
                }
            }
        },
        onRender : function() {
            this.appendHeaderView().appendCategoriesView().appendCurrenciesView();
            this.calculateIScrollWidth().bindEventsToIScroll();
        },

        appendHeaderView : function() {
            this.ui.menuRegion.append(this.headerView.render().el);
            return this;
        },

        appendCategoriesView : function() {
            this.ui.goodsIscrollContainer.append(this.categoriesView.render().el);
            return this;
        },

        appendCurrenciesView : function() {
            this.ui.goodsIscrollContainer.append(this.currenciesView.render().el);
            return this;
        },





        createCategoriesView : function(categories) {

            this.categoriesView = new CategoriesView({
                collection 		: categories,
                itemViewOptions : function(item) {
                    return {
                        model       : item,
                        collection  : item.getGoods()
                    };
                }
            });

            // Listen to logical events
            this.listenTo(this.categoriesView, {
                "itemview:itemview:buy"     : this.buyItem,
                "itemview:itemview:equip" 	: this.equipGoods,
                "itemview:itemview:upgrade" : this.upgradeGood
            });
        },


        createCurrenciesView : function(currencies) {

            this.currenciesView = new CurrenciesView({
                collection 		: currencies,
                itemViewOptions : function(item) {
                    return {
                        model       : item,
                        collection  : item.getPacks()
                    };
                }
            });

            // Listen to logical events
            this.listenTo(this.currenciesView, {
                "itemview:itemview:buy"     : this.buyItem
            });
        },
        buyItem : function (categoryView, itemView) {
            this.playSound().wantsToBuyItem(itemView.model.id);
        },
        equipGoods : function (categoryView, itemView) {
            this.playSound().wantsToEquipGoods(itemView.model);
        },
        chooseCurrencyCategory : function (view) {
            var currencyView = this.currenciesView.children.findByModel(view.model);
            this.iscrolls.onlyOne.scrollToElement(currencyView.el, 500);
        },
        chooseCategory : function (view) {
            var categoryView = this.categoriesView.children.findByModel(view.model);
            this.iscrolls.onlyOne.scrollToElement(categoryView.el, 500);
        },







        bindEventsToIScroll : function() {

            //
            // Listen to view change events
            // Event legend:
            //
            // "after:item:added"           - Category \ Currency added
            // "item:removed"               - Category \ Currency removed
            // "itemview:after:item:added"  - Good \ Pack added
            // "itemview:after:item:added"  - Good \ Pack removed
            //
            this.listenTo(this.categoriesView, "after:item:added item:removed itemview:after:item:added itemview:item:removed", this.refreshIScroll);
            this.listenTo(this.currenciesView, "after:item:added item:removed itemview:after:item:added itemview:item:removed", this.refreshIScroll);
        },
        refreshIScroll : function() {
            this.calculateIScrollWidth();
            this.iscrolls.onlyOne.refresh();
        },
        calculateIScrollWidth : function() {
            var count = this.ui.goodsIscrollContainer.find("li").length,
            	width = this.ui.goodsIscrollContainer.find("li:first").outerWidth(true);
            this.ui.goodsIscrollContainer.width(count * width);
            return this;
        },



        zoomFunction : function () {
            return (innerWidth / innerHeight) > (3/2) ? (innerHeight / 1280) : (innerWidth / 1920);
        }
    });

    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});
