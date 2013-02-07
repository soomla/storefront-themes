define(["jquery", "backbone", "components", "marionette", "handlebars", "templates"], function($, Backbone, Components, Marionette, Handlebars) {

    var HeaderView = Marionette.View.extend({
        initialize : function() {
            _.bindAll(this, "switchHeader");
            this.state = "menu";
        },
        events : {
            "click .back" : function() {
                this.trigger(this.state == "menu" ? "quit" : "back");
            }
        },
        ui : {
            backButton : "#back-button",
            quitButton : "#quit-button"
        },
        switchHeader : function(title) {
            this.$(".title-container h1").html(title);

            if (this.state == "menu") {
                this.ui.backButton.hide();
                this.ui.quitButton.show();
            } else {
                this.ui.quitButton.hide();
                this.ui.backButton.show();
            }
        }
    });


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "switchToPage", "leaveStore");
            this.dialogModel = this.theme.noFundsModal;

            var currencies 		= this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables"),
                tapjoy          = this.theme.tapjoy,
                templateHelpers = { images : this.theme.images },
                $this           = this;


            // Define view types
            var ExpandableListItemView = Components.ExpandableListItemView.extend({
                onExpand        : function() {
                    this.$(".expand-collapse").attr("src", this.templateHelpers().images.collapseImage);
                    this.$el.css("background-image", "url('" + this.templateHelpers().images.itemBackgroundImageExpanded + "')");
                },
                onCollapse      : function() {
                    this.$(".expand-collapse").attr("src", this.templateHelpers().images.expandImage);
                    this.$el.css("background-image", "url('" + this.templateHelpers().images.itemBackgroundImage + "')");
                }
            });
            var VirtualGoodView = ExpandableListItemView.extend({
                template        : Handlebars.getTemplate("item"),
                templateHelpers : function() {

                    var modelAssets = $this.model.get("modelAssets");
                    return _.extend({
                        imgFilePath : modelAssets["virtualGoods"][this.model.id],
                        currency : {
                            imgFilePath : modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                        },
                        price : this.model.get("priceModel").values[this.model.getCurrencyId()],
                        item : $this.theme.pages.goods.item
                    }, templateHelpers);
                },
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CurrencyPackView = ExpandableListItemView.extend({
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers : function() {

                    var modelAssets = $this.model.get("modelAssets");
                    return _.extend({
                        imgFilePath : modelAssets["currencyPacks"][this.model.id],
                        item : $this.theme.pages.currencyPacks.item
                    }, templateHelpers);
                },
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CategoryView = Components.ListItemView.extend({
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
                    return _.extend({
                        imgFilePath : modelAssets["nonConsumables"][this.model.id]
                    }, templateHelpers);
                }
            });


            // Create an object to store all child views
            this.pageViews = {};

            // Build category menu and add it to the page views
            var categoryMenuView = new Components.CollectionListView({
                className   : "menu items clearfix",
                collection  : categories,
                itemView    : CategoryView
            }).on("itemview:selected", function(view) {
                this.playSound().switchToPage(view.model.get("name"));
            }, this);
            this.pageViews["menu"]  = categoryMenuView;


            // Create a view for the button linking from the category menu to the currency packs view
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.currencyPacksLink = new CategoryView({
                className : "item currency-packs",
                model : new categories.model({ name : "GET COINS" }),
                templateHelpers : { imgFilePath : this.theme.currencyPacksCategoryImage }
            }).on("selected", function() {
                this.playSound().switchToPage(this.currencyPacksLink.model.get("name"));
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
                }).on("selected", function() {
                    $this.playSound();
                    $this.nativeAPI.requestEarnedCurrency("tapjoy");
                });
            }


            // Mark this view as the active view,
            // as it is the first one visible when the store opens
            this.activeView = categoryMenuView;

            // Render all categories with goods
            categories.each(function(category) {

                var categoryName = category.get("name");

                var view = new Components.ExpandableIScrollCollectionListView({
                    className   : "items virtualGoods category " + categoryName,
                    collection  : category.get("goods"),
                    template    : Handlebars.getTemplate("collection"),
                    itemView    : VirtualGoodView
                }).on({
                    "itemview:expand"       : $this.playSound,
                    "itemview:collapse"     : $this.playSound,
                    "itemview:buy"          : function(view) {  $this.playSound().wantsToBuyVirtualGoods(view.model);   },
                    "itemview:equipped"     : function(view) {  $this.playSound().wantsToEquipGoods(view.model);        },
                    "itemview:unequipped"   : function(view) {  $this.playSound().wantsToUnequipGoods(view.model);      }
                });

                $this.pageViews[categoryName] = view;
            });


            // Build currency packs category and add it to the page views
            var currencyPacksView = new Components.ExpandableIScrollCollectionListView({
                className   : "items currencyPacks category",
                collection  : currencies.at(0).get("packs"),
                template    : Handlebars.getTemplate("collection"),
                itemView    : CurrencyPackView
            }).on({
                "itemview:expanded"     : $this.playSound,
                "itemview:collapsed"    : $this.playSound,
                "itemview:buy" : function(view) { $this.playSound().wantsToBuyMarketItem(view.model); }
            });
            this.pageViews["GET COINS"] = currencyPacksView;


            // Build header view
            this.header = new HeaderView().on({
                back : function() {
                    this.playSound();

                    // First, collapse all list items that are open
                    _.each(this.activeView.children, function(view) {
                        if (view.expanded) view.collapse();
                    });

                    // Second, switch back to the menu
                    this.switchToPage("menu");
                },
                quit : this.leaveStore
            }, this);
        },
        switchToPage : function(name) {
            this.header.state = name;
            this.activeView.$el.hide();
            this.activeView = this.pageViews[name];
            this.activeView.$el.show();
            if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
            var title = name == "menu" ? this.theme.pages.menu.title : name;
            this.header.switchHeader(title);
        },
        onRender : function() {
            // Append background to element
            this.$el.css("background-image", "url('" + this.theme.background + "')");

            // Set header element to bind event delegation
            this.header.setElement(this.$(".header")).bindUIElements();

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
