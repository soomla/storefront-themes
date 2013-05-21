define(["jquery", "backbone", "components", "helperViews",  "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

    // Define view types

    var HeaderView                      = HelperViews.HeaderView,
        getTemplate                     = Handlebars.getTemplate,
        ExpandableEquippableItemView    = Components.ExpandableEquipppableItemView,
        ExpandableSingleUseItemView     = Components.ExpandableSingleUseItemView,
        EquippableVirtualGoodView       = ExpandableEquippableItemView.extend({ template : getTemplate("equippableItem") }),
        SingleUseVirtualGoodView        = ExpandableSingleUseItemView.extend({ template : getTemplate("singleUseItem")}),
        CurrencyPackView                = Components.ItemView.extend({ template : getTemplate("currencyPack"), triggers : {"fastclick .buy" : "buy"} }),
        CategoryView                    = Components.LinkView.extend({ template : getTemplate("categoryMenuItem") }),
        NonConsumableView               = Components.BuyOnceItemView.extend({ template : getTemplate("nonConsumableItem")}),
        IScrollCollectionView           = Components.IScrollCollectionView.extend({ template: getTemplate("collection") });
        ExpandableIScrollCollectionView = Components.ExpandableIScrollCollectionView.extend({ template: getTemplate("collection") });


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            commonHelpers   = { images : theme.images };


        // Add template helpers to view prototypes

        var createTemplateHelpers = function(helpers) {
            return _.extend(helpers, commonHelpers);
        };
        var templateHelpers = function () {

            var modelAssets = model.get("modelAssets");
            return createTemplateHelpers({
                imgFilePath: modelAssets["virtualGoods"][this.model.id],
                currency: {
                    imgFilePath: modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                },
                price: this.model.get("priceModel").values[this.model.getCurrencyId()],

                // This is a hack, because Backofgen ignores empty objects in the theme
                item: (theme.pages.goods && theme.pages.goods.item) ? theme.pages.goods.item : {}
            });
        };

        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        SingleUseVirtualGoodView.prototype.templateHelpers = templateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return createTemplateHelpers({
                imgFilePath : modelAssets["currencyPacks"][this.model.id],
                currency: {
                    imgFilePath: modelAssets["virtualCurrencies"][this.model.get("currency_itemId")]
                },

                // This is a hack, because Backofgen ignores empty objects in the theme
                item: (theme.pages.currencyPacks && theme.pages.currencyPacks.item) ? theme.pages.currencyPacks.item : {}
            });
        };
        CategoryView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                imgFilePath : modelAssets["categories"][this.model.id]
            };
        };
        NonConsumableView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return createTemplateHelpers({
                imgFilePath : modelAssets["nonConsumables"][this.model.id]
            });
        };

    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            this.dialogModal = this.theme.noFundsModal;
            this.loadingModal = {
                "text": "Loading...",
                "background": this.dialogModal.background,
                "textStyle": this.dialogModal.textStyle
            };

            var currencies 		= this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables"),
                tapjoy          = this.theme.tapjoy,
                headerStates    = {};


            // Build category menu and add it to the page views
            var categoryMenuView = new IScrollCollectionView({
                className   : "menu items clearfix",
                collection  : categories,
                itemView    : CategoryView
            }).on("itemview:select", function(view) {
                this.playSound().changeViewTo(this.children.findByCustom(view.model.cid));
            }, this);
            this.children.add(categoryMenuView, "menu");
            headerStates[categoryMenuView.cid] = this.theme.pages.menu.title;


            // Create a view for the button linking from the category menu to the currency packs view
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.currencyPacksLinks = [];

            currencies.each(function(currency) {
                var link = new CategoryView({
                    className : "item currency-packs",
                    templateHelpers : { imgFilePath : this.theme.currencyPacksCategoryImage }
                }).on("select", function() {
                    this.playSound().changeViewTo(this.children.findByCustom(currency.cid));
                }, this);

                this.currencyPacksLinks.push(link);
            }, this);

            // Create views for the earned currency links from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.nonConsumbaleLinks = [];

            nonConsumables.each(function(nonConsumable) {

                var view = new NonConsumableView({
                    className : "item non-consumable",
                    model : nonConsumable
                }).on("buy", function(args) {
                    this.playSound().wantsToBuyMarketItem(args.model);
                }, this);

                this.nonConsumbaleLinks.push(view);
            }, this);

            // Create a view for a Tapjoy link from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            if (tapjoy) {
                this.tapjoyView = new CategoryView({
                    className : "item earned-currency",
                    templateHelpers : { imgFilePath : this.model.get("modelAssets").tapjoy }
                }).on("select", function() {
                    this.playSound().requestEarnedCurrency("tapjoy");
                }, this);
            }



            // View event listeners
            var wantsToBuyVirtualGoods = _.bind(function (view) {
                this.playSound().wantsToBuyVirtualGoods(view.model);
            }, this);
            var wantsToEquipGoods = _.bind(function (view) {
                this.playSound().wantsToEquipGoods(view.model);
            }, this);
            var wantsToBuyMarketItem = _.bind(function (view) {
                this.playSound().wantsToBuyMarketItem(view.model);
            }, this);


            // Mark this view as the active view,
            // as it is the first one visible when the store opens
            this.activeView = categoryMenuView;


            // Render all categories with goods
            categories.each(function(category) {

                var categoryName 	= category.get("name"),
                    equipping 		= category.get("equipping"),
                	goods 			= category.get("goods"),
                    view;

                if (equipping === "single") {
                    view = new ExpandableIScrollCollectionView({
                        className   : "items virtualGoods category " + categoryName,
                        collection  : goods,
                        itemView    : EquippableVirtualGoodView
                    }).on({
                        "itemview:expand"   : this.playSound,
                        "itemview:collapse" : this.conditionalPlaySound,
                        "itemview:buy"      : wantsToBuyVirtualGoods,
                        "itemview:equip"    : wantsToEquipGoods
                    }, this);
                } else {
                    view = new ExpandableIScrollCollectionView({
                        className   : "items virtualGoods category " + categoryName,
                        collection  : goods,
                        itemView    : SingleUseVirtualGoodView
                    }).on({
                        "itemview:expand"   : this.playSound,
                        "itemview:collapse" : this.conditionalPlaySound,
                        "itemview:buy"      : wantsToBuyVirtualGoods
                    }, this);
                }

                this.children.add(view, category.cid);
                headerStates[view.cid] = categoryName;
            }, this);


            // Build currency packs category and add it to the page views
            currencies.each(function(currency) {
                var currencyPacksView = new ExpandableIScrollCollectionView({
                    className   : "items currencyPacks category",
                    collection  : currency.get("packs"),
                    itemView    : CurrencyPackView
                }).on("itemview:buy", function(view) {
                    this.playSound().wantsToBuyMarketItem(view.model);
                }, this);
                this.children.add(currencyPacksView, currency.cid);
                headerStates[currencyPacksView.cid] = currency.get("name");
            }, this);


            // Build header view
            this.header = new HeaderView({states : headerStates, initialState : categoryMenuView.cid}).on({
                back: function () {
                    this.playSound();

                    // Switch back to the menu
                    this.changeViewTo(categoryMenuView);
                },
                quit: this.leaveStore
            }, this);
        },
        changeViewTo: function (newview) {
            // Collapse open item in current category
            if (this.activeView.collapseExpandedChild)
                this.activeView.collapseExpandedChild({ noSound: true });

            var _activeMenu = this.activeView.$el.hasClass("menu");
            var _pages = this.activeView.$el.parents("div#pages");

            if(_activeMenu){
                _pages.addClass("slide");
                // add class "on" to the relevant category only 
                newview.$el.addClass("on");
            }else{
                if(newview.$el.hasClass("menu")){
                    // new view is menu 
                    _pages.removeClass("slide");
                }else{
                    // switching between two views and NOT going thru menu...
                    // add class "on" to the relevant category only 
                    newview.$el.addClass("on");
                }
                // remove class "on" from "old" category
                this.activeView.$el.removeClass("on");
            }

            newview.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
                newview.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                $(_pages).animate({ scrollTop: 0 }, "slow");
            });

            this.activeView = newview;
            
            if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
            this.header.changeStateTo(newview.cid);
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;
            
            var currencyPacksItem = this.model.currencyPacksMap[itemId];
            if (currencyPacksItem) {
                var currency = currencyPacksItem.get("currency_itemId");
                this.showCurrencyPacks(currency);
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (!goodsItem) {
                console.log('View was not changed. Could not find item: "' + itemId + '".');
                return;
            }

            var categoryId = goodsItem.get('categoryId'),
                categroy = this.model.get("categories").get(categoryId),
                view = this.children.findByCustom(categroy.cid);

            // Change to view of given category
            this.changeViewTo(view);
        },
        showCurrencyPacks : function(currencyId) {
            // Change to view of given currency ID
            var currency    = this.model.get("virtualCurrencies").get(currencyId),
                view        = this.children.findByCustom(currency.cid);
            this.changeViewTo(view);
        },
        ui : {
            pages   : "#pages",
            header  : ".header"
        },
        onRender: function () {
            // Set header element to bind event delegation
            this.header.setElement(this.ui.header).render().bindUIElements();

            // Render child views (items in goods store and currency store)
            this.children.each(function(view) {
                this.ui.pages.append(view.render().el);
            }, this);

            var menu = this.children.findByCustom("menu").$el.children(":first-child");

            // Append the link to the currency packs as a "category view"
            _.each(this.currencyPacksLinks, function(link) {
                menu.append(link.render().el);
            });

            // Append links to earned currencies as "category views"
            if (this.tapjoyView) menu.append(this.tapjoyView.render().el);

            // Append non consumable items as "category views"
            _.each(this.nonConsumbaleLinks, function(view) {
                menu.append(view.render().el);
            });

            if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
        },
        zoomFunction : function() {
            return (innerWidth / innerHeight) > 1.5 ? (innerHeight / 640) : (innerWidth / 960);
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

// grunt-rigger directive:
//= handlebars-templates
