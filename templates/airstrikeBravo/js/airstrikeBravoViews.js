define(["jquery", "backbone", "components", "helperViews",  "handlebars", "templates"], function($, Backbone, Components, HelperViews, Handlebars) {

    var HeaderView = HelperViews.HeaderView;

    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "leaveStore");
            this.dialogModel = this.theme.noFundsModal;

            var currencies 		= this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables"),
                tapjoy          = this.theme.tapjoy,
                commonHelpers   = { images : this.theme.images },
                headerStates    = {},
                packsTitle      = "GET COINS",
                $this           = this;

            var createTemplateHelpers = function(helpers) {
                return _.extend(helpers, commonHelpers);
            };


            // Define view types

            var expandCollapseCallbacks = {
                onExpand: function () {
                    this.$el.css("background-image", "url('" + this.templateHelpers().images.itemBackgroundImageExpanded + "')");
                },
                onCollapse: function () {
                    this.$el.css("background-image", "url('" + this.templateHelpers().images.itemBackgroundImage + "')");
                }
            };
            var ExpandableEquippableItemView    = Components.ExpandableEquipppableItemView.extend(expandCollapseCallbacks);
            var ExpandableSingleUseItemView     = Components.ExpandableSingleUseItemView.extend(expandCollapseCallbacks);


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

            var EquippableVirtualGoodView = ExpandableEquippableItemView.extend({
                template        : Handlebars.getTemplate("equippableItem"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var SingleUseVirtualGoodView = ExpandableSingleUseItemView.extend({
                template        : Handlebars.getTemplate("singleUseItem"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });


			var CurrencyPackView = ExpandableEquippableItemView.extend({
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers : function() {

                    var modelAssets = $this.model.get("modelAssets");
                    return createTemplateHelpers({
                        imgFilePath : modelAssets["currencyPacks"][this.model.id],
                        item : $this.theme.pages.currencyPacks.item
                    });
                },
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CategoryView = Components.ItemView.extend({
                template        : Handlebars.getTemplate("categoryMenuItem"),
                templateHelpers : function() {

                    var modelAssets = $this.model.get("modelAssets");
                    return {
                        imgFilePath : modelAssets["categories"][this.model.id]
                    };
                }
            });
            var NonConsumableView = Components.BuyOnceItemView.extend({
                template        : Handlebars.getTemplate("nonConsumableItem"),
                templateHelpers : function() {

                    var modelAssets = $this.model.get("modelAssets");
                    return createTemplateHelpers({
                        imgFilePath : modelAssets["nonConsumables"][this.model.id]
                    });
                }
            });
            var ExpandableIScrollCollectionView = Components.ExpandableIScrollCollectionView.extend({
                template : Handlebars.getTemplate("collection")
            });


			// Create an object to store all child views
            this.pageViews = {};

            // Build category menu and add it to the page views
            var categoryMenuView = new Components.CollectionView({
                className   : "menu items clearfix",
                collection  : categories,
                itemView    : CategoryView
            }).on("itemview:select", function(view) {
                this.playSound().changeViewTo(this.pageViews[view.model.cid]);
            }, this);
            this.pageViews.menu  = categoryMenuView;
            headerStates[categoryMenuView.cid] = this.theme.pages.menu.title;


            // Create a view for the button linking from the category menu to the currency packs view
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.currencyPacksLink = new CategoryView({
                className : "item currency-packs",
                model : new categories.model({ name : packsTitle }),
                templateHelpers : { imgFilePath : this.theme.currencyPacksCategoryImage }
            }).on("select", function() {
                this.playSound().changeViewTo(currencyPacksView);
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
                    model : new Backbone.Model(), // Hack to allow event binding
                    templateHelpers : { imgFilePath : this.model.get("modelAssets").tapjoy }
                }).on("select", function() {
                    $this.playSound();
                    $this.nativeAPI.requestEarnedCurrency("tapjoy");
                });
            }


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
                        "itemview:expand"       : $this.playSound,
                        "itemview:collapse"     : $this.playSound,
                        "itemview:buy"          : function(view) {  $this.playSound().wantsToBuyVirtualGoods(view.model);   },
                        "itemview:equip"     	: function(view) {  $this.playSound().wantsToEquipGoods(view.model);        }
                    });
                } else {
                    view = new ExpandableIScrollCollectionView({
                        className   : "items virtualGoods category " + categoryName,
                        collection  : goods,
                        itemView    : SingleUseVirtualGoodView
                    }).on({
                        "itemview:expand"       : $this.playSound,
                        "itemview:collapse"     : $this.playSound,
                        "itemview:buy"          : function(view) {  $this.playSound().wantsToBuyVirtualGoods(view.model);   }
                    });
                }

                $this.pageViews[category.cid] = view;
                headerStates[view.cid] = categoryName;
            });


            // Build currency packs category and add it to the page views
            var currencyPacksView = new ExpandableIScrollCollectionView({
                className   : "items currencyPacks category",
                collection  : currencies.at(0).get("packs"),
                itemView    : CurrencyPackView
            }).on({
                "itemview:expand"   : $this.playSound,
                "itemview:collapse" : $this.playSound,
                "itemview:buy" : function(view) { $this.playSound().wantsToBuyMarketItem(view.model); }
            });
            this.pageViews[currencyPacksView.cid] = currencyPacksView;
            headerStates[currencyPacksView.cid] = packsTitle;


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
            // Append background to element
            this.$el.css("background-image", "url('" + this.theme.background + "')");

            // Set header element to bind event delegation
            this.header.setElement(this.$(".header")).render().bindUIElements();

            // Render child views (items in goods store and currency store)
            var $this = this;
            _.each(this.pageViews, function(view) {
                $this.$("#pages").append(view.render().el);
            });

            // Append the link to the currency packs as a "category view"
            this.pageViews.menu.$el.append(this.currencyPacksLink.render().el);

            // Append links to earned currencies as "category views"
            if (this.tapjoyView) this.pageViews.menu.$el.append(this.tapjoyView.render().el);

            // Append non consumable items as "category views"
            _.each(this.nonConsumbaleLinks, function(view) {
                $this.pageViews.menu.$el.append(view.render().el);
            });
        },
        leaveStore : function() {
            this.playSound().wantsToLeaveStore();
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
