define("airstrikeBravoPortraitViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    // Define view types

    var HeaderView                      = HelperViews.HeaderView,
        getTemplate                     = Handlebars.getTemplate,
        ExpandableEquippableItemView    = Components.ExpandableEquipppableItemView,
        ExpandableSingleUseItemView     = Components.ExpandableSingleUseItemView,
        EquippableVirtualGoodView       = ExpandableEquippableItemView.extend({ template : getTemplate("equippableItem") }),
        SingleUseVirtualGoodView        = ExpandableSingleUseItemView.extend({ template : getTemplate("singleUseItem")}),
        LifetimeVirtualGoodView         = Components.ExpandableLifetimeItemView.extend({ template : getTemplate("equippableItem")}),
        CurrencyPackView                = Components.ItemView.extend({ template : getTemplate("currencyPack"), triggers : {"fastclick .buy" : "buy"} }),
        CategoryView                    = Components.LinkView.extend({ template : getTemplate("categoryMenuItem") }),
        NonConsumableView               = Components.BuyOnceItemView.extend({ template : getTemplate("nonConsumableItem")}),
		CurrencyPacksCollectionView     = Components.ExpandableIScrollCollectionView.extend({ template: getTemplate("collection") }),
		GoodsCollectionView             = Components.ExpandableIScrollCollectionView.extend({
			template: getTemplate("collection"),
			getItemView: function(item) {

				if (!item) {
					return Components.ExpandableIScrollCollectionView.prototype.getItemView.apply(this, arguments);
				} else {

					var itemView;

					// some logic to calculate which view to return
					// TODO: Add all virtual good types
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
		});


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            commonHelpers   = { images : theme.images };


        // Add template helpers to view prototypes

        var createTemplateHelpers = function(helpers) {
            return _.extend(helpers, commonHelpers);
        };
        var templateHelpers = function () {

            var modelAssets = model.getModelAssets();
            return createTemplateHelpers({
                imgFilePath: modelAssets.items[this.model.id],
                currency: {
                    imgFilePath: modelAssets.items[this.model.getCurrencyId()]
                },
                price: this.model.getPrice(),

                // This is a hack, because Backofgen ignores empty objects in the theme
                item: (theme.pages.goods && theme.pages.goods.item) ? theme.pages.goods.item : {}
            });
        };

        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        LifetimeVirtualGoodView.prototype.templateHelpers   = templateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return createTemplateHelpers({
                price: this.model.getPrice(),
                imgFilePath : modelAssets.items[this.model.id],
                currency: {
                    imgFilePath: modelAssets.items[this.model.get("currency_itemId")]
                },

                // This is a hack, because Backofgen ignores empty objects in the theme
                item: (theme.pages.currencyPacks && theme.pages.currencyPacks.item) ? theme.pages.currencyPacks.item : {}
            });
        };
        CategoryView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return {
                imgFilePath : modelAssets.categories[this.model.id]
            };
        };
        NonConsumableView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return createTemplateHelpers({
                imgFilePath : modelAssets.items[this.model.id]
            });
        };

    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {

            // Initialize dialog metadata
            this.dialogModal = this.theme.noFundsModal;
            this.messageDialogOptions = {
                background 	: this.dialogModal.background,
                textStyle 	: this.dialogModal.textStyle
            };
            this.loadingModal = _.extend({text : "Loading..."}, this.messageDialogOptions);


            var currencies 		= this.model.get("currencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables"),
                headerStates    = {};


            // Build category menu and add it to the page views
            var categoryMenuView = new Components.CollectionView({
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
                }).on("buy", wantsToBuyItem);

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
            var wantsToBuyItem = _.bind(function (view) {
                this.playSound().wantsToBuyItem(view.model.id);
            }, this);
            var wantsToEquipGoods = _.bind(function (view) {
                this.playSound().wantsToEquipGoods(view.model);
            }, this);

            // This is a special playSound function that resolves the playSound
            // function defined on the store view object only when called.
            // This is used so that the function from the nativeAPI stubs is called
            var playSound = _.bind(function() {
                return this.playSound();
            }, this);


            // Mark this view as the active view,
            // as it is the first one visible when the store opens
            this.activeView = categoryMenuView;


            // Render all categories with goods
            categories.each(function(category) {

                var categoryName 	= category.get("name"),
                    goods 			= category.get("goods"),
                    view;

                view = new GoodsCollectionView({
					className   : "items virtualGoods category " + categoryName,
                    collection  : goods
				}).on({
					"itemview:expand" 	: playSound,
					"itemview:collapse" : this.conditionalPlaySound,
                    "itemview:buy"      : wantsToBuyItem,
					"itemview:equip"    : wantsToEquipGoods
				}, this);

                this.children.add(view, category.cid);
                headerStates[view.cid] = categoryName;
            }, this);


            // Build currency packs category and add it to the page views
            currencies.each(function(currency) {
                var currencyPacksView = new CurrencyPacksCollectionView({
					className   : "items currencyPacks category",
					collection  : currency.get("packs"),
					itemView    : CurrencyPackView
                }).on("itemview:buy", wantsToBuyItem);
                this.children.add(currencyPacksView, currency.cid);
                headerStates[currencyPacksView.cid] = currency.get("name");
            }, this);


            // Build header view
            this.header = new HeaderView({states : headerStates, initialState : categoryMenuView.cid}).on({
                back : function() {
                    this.playSound();

                    // Switch back to the menu
                    this.changeViewTo(categoryMenuView);
                },
                quit : this.leaveStore
            }, this);
        },
        changeViewTo: function (newview) {
            // Collapse open item in current category
            if (this.activeView.collapseExpandedChild)
                this.activeView.collapseExpandedChild({ noSound: true });

            if (this.activeView != newview) {
                var _activeMenu = this.activeView.$el.hasClass("menu");
                var _pages = this.activeView.$el.parents("div#pages");

                if (_activeMenu) {
                    _pages.addClass("flip");
                    // add class "on" to the relevant category only 
                    newview.$el.addClass("on");
                } else {
                    if (newview.$el.hasClass("menu")) {
                        // new view is menu 
                        _pages.removeClass("flip");
                    } else {
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
                /*
                 this.activeView.$el.hide();
                 this.activeView = view;
                 this.activeView.$el.show();
                 */
                this.activeView = newview;
                if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
                this.header.changeStateTo(newview.cid);
            }
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var currencyPacksItem = this.model.marketItemsMap[itemId];
            if (currencyPacksItem) {
                var currency = currencyPacksItem.get("currency_itemId");
                this.showCurrencyPacks(currency);
                this.activeView.scrollToItemByModel(currencyPacksItem, 500);
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (!goodsItem) {
                console.log('View was not changed. Could not find item: "' + itemId + '".');
                return;
            }

            var category = this.model.categoryMap[itemId],
                view     = this.children.findByCustom(category.cid);

            // Change to view of given category
            this.changeViewTo(view);
            this.activeView.scrollToItemByModel(goodsItem, 500);
        },
        showCurrencyPacks: function (currencyId) {
            // Change to view of given currency ID
            var currency    = this.model.get("currencies").get(currencyId),
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
