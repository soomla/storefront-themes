define(["jquery", "backbone", "components", "helperViews", "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

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
        ExpandableIScrollCollectionView = Components.ExpandableIScrollCollectionView.extend({ template : getTemplate("collection") });


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
            this.dialogModel = this.theme.noFundsModal;

            var currencies 		= this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables"),
                headerStates    = {};


            // Build category menu and add it to the page views
            var categoryMenuView = new Components.CollectionView({
                className   : "menu items clearfix",
                collection  : categories,
                itemView    : CategoryView
            }).on("itemview:select", function(view) {
                console.log("tightRope itemview:select", view.model.cid)
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

            // Create views for the earned currency links from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.earnedCurrencyLinks = [];

            _.each(this.theme.earnedCurrencies, function(earnedCurrency) {

                var earnedCurrency = new CategoryView({
                    className : "item earned-currency",
                    model : new categories.model(earnedCurrency),
                    templateHelpers : { imgFilePath : earnedCurrency.imgFilePath }
                }).on("select", function() {
                    this.playSound().requestEarnedCurrency(this.model.get("provider"));
                }, this);

                this.earnedCurrencyLinks.push(earnedCurrency);
            }, this);


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
                        "itemview:expand" 	: this.playSound,
                        "itemview:collapse" : this.conditionalPlaySound,
                        "itemview:buy"      : wantsToBuyVirtualGoods,
                        "itemview:equip"    : wantsToEquipGoods
                    });
                } else {
                    view = new ExpandableIScrollCollectionView({
                        className   : "items virtualGoods category " + categoryName,
                        collection  : goods,
                        itemView    : SingleUseVirtualGoodView
                    }).on({
                        "itemview:expand" 	: this.playSound,
                        "itemview:collapse" : this.conditionalPlaySound,
                        "itemview:buy"      : wantsToBuyVirtualGoods
                    });
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
                back : function() {
                    this.playSound();

                    // First, collapse open item in current category
                    this.activeView.collapseExpandedChild({noSound: true});

                    // Second, switch back to the menu
                    this.changeViewTo(categoryMenuView);
                },
                quit : this.leaveStore
            }, this);
        },
        changeViewTo : function(newview) {
            var _activeMenu = this.activeView.$el.hasClass("menu");
            var _pages = this.activeView.$el.parents("div#pages");

            if(_activeMenu){
                _pages.addClass("flip");
                // add class "on" to the relevant category only 
                newview.$el.addClass("on");
            }else{
                if(newview.$el.hasClass("menu")){
                    // new view is menu 
                    _pages.removeClass("flip");
                }else{
                    // switching between two views and NOT going thru menu...
                    // add class "on" to the relevant category only 
                    newview.$el.addClass("on");
                }
                // remove class "on" from "old" category
                this.activeView.$el.removeClass("on");
            }

            newview.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){ 
                //console.log("end")
                newview.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                $(_pages).animate({ scrollTop: 0 }, "slow");
            });

            this.activeView = newview;
            /*

            var _pages = this.activeView.$el.parents("div#pages");
            _pages.toggleClass("flip");
            if(_pages.hasClass("flip")){
                // add class "on" to the relevant category only 
                view.$el.addClass("on");
            }else{
                this.activeView.$el.removeClass("on"); 
            }

            this.activeView = view;
            view.$el.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){ 
                //console.log("end")
                view.$el.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                $(_pages).animate({ scrollTop: 0 }, "slow");
            });
            /*
            this.activeView.$el.hide();
            this.activeView = view;
            this.activeView.$el.show();
            */

            if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
            this.header.changeStateTo(newview.cid);
        },
        showCurrencyPacks : function(currencyId) {

            // Collapse open item in current category
            this.activeView.collapseExpandedChild({noSound: true});

            // Change to view of given currency ID
            var currency    = this.model.get("virtualCurrencies").get(currencyId),
                view        = this.children.findByCustom(currency.cid);
            this.changeViewTo(view);
        },
        ui : {
            pages   : "#pages",
            header  : ".header"
        },
        onRender : function() {
            var menu = this.children.findByCustom("menu");

            // Set header element to bind event delegation
            this.header.setElement(this.ui.header).render().bindUIElements();

            // Render child views (items in goods store and currency store)
            this.children.each(function(view) {
                this.ui.pages.append(view.render().el);
            }, this);

            // Append the link to the currency packs as a "category view"
            _.each(this.currencyPacksLinks, function(link) {
                menu.$el.append(link.render().el);
            });

            // Append links to earned currencies as "category views"
            _.each(this.earnedCurrencyLinks, function(view) {
                menu.$el.append(view.render().el);
            });

            // Append non consumable items as "category views"
            _.each(this.nonConsumbaleLinks, function(view) {
                menu.$el.append(view.render().el);
            });
            // iPhone hack for problematic description line height
            if (isMobile.iOS()) {
                this.$(".item .description").css("line-height", "70px");
            }
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 640) : (innerHeight / 960);
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
