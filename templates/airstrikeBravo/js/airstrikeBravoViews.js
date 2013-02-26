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
        ExpandableIScrollCollectionView = Components.ExpandableIScrollCollectionView.extend({ template : getTemplate("collection") });


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            this.dialogModel = this.theme.noFundsModal;

            var currencies 		= this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables"),
                tapjoy          = this.theme.tapjoy,
                commonHelpers   = { images : this.theme.images },
                headerStates    = {},
                $this           = this;




            // Add template helpers to view prototypes

            var createTemplateHelpers = function(helpers) {
                return _.extend(helpers, commonHelpers);
            };
            var templateHelpers = function () {

                var modelAssets = $this.model.get("modelAssets");
                return createTemplateHelpers({
                    imgFilePath: modelAssets["virtualGoods"][this.model.id],
                    currency: {
                        imgFilePath: modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                    },
                    price: this.model.get("priceModel").values[this.model.getCurrencyId()],
                    item: $this.theme.pages.goods.item
                });
            };

            EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
            SingleUseVirtualGoodView.prototype.templateHelpers = templateHelpers;

			CurrencyPackView.prototype.templateHelpers = function() {
                var modelAssets = $this.model.get("modelAssets");
                return createTemplateHelpers({
                    imgFilePath : modelAssets["currencyPacks"][this.model.id],
                    currency: {
                        imgFilePath: modelAssets["virtualCurrencies"][this.model.get("currency_itemId")]
                    },
                    item : $this.theme.pages.currencyPacks.item
                });
            };
            CategoryView.prototype.templateHelpers = function() {
                var modelAssets = $this.model.get("modelAssets");
                return {
                    imgFilePath : modelAssets["categories"][this.model.id]
                };
            };
            NonConsumableView.prototype.templateHelpers = function() {
                var modelAssets = $this.model.get("modelAssets");
                return createTemplateHelpers({
                    imgFilePath : modelAssets["nonConsumables"][this.model.id]
                });
            };


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
                    templateHelpers : { imgFilePath : $this.theme.currencyPacksCategoryImage }
                }).on("select", function() {
                    this.playSound().changeViewTo(this.children.findByCustom(currency.cid));
                }, $this);

                $this.currencyPacksLinks.push(link);
            });

            // Create views for the earned currency links from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.nonConsumbaleLinks = [];

            nonConsumables.each(function(nonConsumable) {

                var view = new NonConsumableView({
                    className : "item non-consumable",
                    model : nonConsumable
                }).on("buy", function() {
                    $this.playSound();
                    $this.wantsToBuyMarketItem(this.model);
                });

                $this.nonConsumbaleLinks.push(view);
            });

            // Create a view for a Tapjoy link from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            if (tapjoy) {
                this.tapjoyView = new CategoryView({
                    className : "item earned-currency",
                    templateHelpers : { imgFilePath : this.model.get("modelAssets").tapjoy }
                }).on("select", function() {
                    $this.playSound();
                    $this.nativeAPI.requestEarnedCurrency("tapjoy");
                });
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

                if (equipping) {
                    view = new ExpandableIScrollCollectionView({
                        className   : "items virtualGoods category " + categoryName,
                        collection  : goods,
                        itemView    : EquippableVirtualGoodView
                    }).on({
                        "itemview:expand"   : $this.playSound,
                        "itemview:collapse" : $this.playSound,
                        "itemview:buy"      : wantsToBuyVirtualGoods,
                        "itemview:equip"    : wantsToEquipGoods
                    });
                } else {
                    view = new ExpandableIScrollCollectionView({
                        className   : "items virtualGoods category " + categoryName,
                        collection  : goods,
                        itemView    : SingleUseVirtualGoodView
                    }).on({
                        "itemview:expand"   : $this.playSound,
                        "itemview:collapse" : $this.playSound,
                        "itemview:buy"      : wantsToBuyVirtualGoods
                    });
                }

                $this.children.add(view, category.cid);
                headerStates[view.cid] = categoryName;
            });


            // Build currency packs category and add it to the page views
            currencies.each(function(currency) {
                var currencyPacksView = new ExpandableIScrollCollectionView({
                    className   : "items currencyPacks category",
                    collection  : currency.get("packs"),
                    itemView    : CurrencyPackView
                }).on("itemview:buy", function(view) {
                    $this.playSound().wantsToBuyMarketItem(view.model);
                });
                $this.children.add(currencyPacksView, currency.cid);
                headerStates[currencyPacksView.cid] = currency.get("name");
            });


            // Build header view
            this.header = new HeaderView({states : headerStates, initialState : categoryMenuView.cid}).on({
                back : function() {
                    this.playSound();

                    // First, collapse open item in currenct category
                    this.activeView.collapseExpandedChild();

                    // Second, switch back to the menu
                    this.changeViewTo(categoryMenuView);
                },
                quit : this.leaveStore
            }, this);
        },
        changeViewTo : function(view) {
            this.activeView.$el.hide();
            this.activeView = view;
            this.activeView.$el.show();
            if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
            this.header.changeStateTo(view.cid);
        },
        onRender : function() {
            var $this   = this,
                menu    = this.children.findByCustom("menu");

            // Set header element to bind event delegation
            this.header.setElement(this.$(".header")).render().bindUIElements();

            // Render child views (items in goods store and currency store)
            this.children.each(function(view) {
                $this.$("#pages").append(view.render().el);
            });

            // Append the link to the currency packs as a "category view"
            _.each(this.currencyPacksLinks, function(link) {
                menu.$el.append(link.render().el);
            });

            // Append links to earned currencies as "category views"
            if (this.tapjoyView) menu.$el.append(this.tapjoyView.render().el);

            // Append non consumable items as "category views"
            _.each(this.nonConsumbaleLinks, function(view) {
                menu.$el.append(view.render().el);
            });
        },
        zoomFunction : function() {
            return (innerWidth / innerHeight) > 1.5 ? (innerHeight / 640) : (innerWidth / 960);
        }
    });


    return {
        StoreView : StoreView
    };
});

// grunt-rigger directive:
//= handlebars-templates
