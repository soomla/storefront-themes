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
            _.bindAll(this, "switch");
            this.dialogModel = this.theme.noFundsModal;


            var virtualGoods    = this.model.get("virtualGoods"),
                currencyPacks   = this.model.get("currencyPacks"),
                categories      = this.model.get("categories"),
                templateHelpers = { images : this.theme.images },
                $this           = this;


            // Define view types
            var ExpandableListItemView = Components.ExpandableListItemView.extend({
                onExpand        : function() {
                    this.$el.addClass("expanded");
                    this.$(".expand-collapse").attr("src", this.templateHelpers.images.collapseImage);
                    this.$el.css("background-image", "url('" + this.templateHelpers.images.itemBackgroundImageExpanded + "')");
                },
                onCollapse      : function() {
                    this.$el.removeClass("expanded");
                    this.$(".expand-collapse").attr("src", this.templateHelpers.images.expandImage);
                    this.$el.css("background-image", "url('" + this.templateHelpers.images.itemBackgroundImage + "')");
                }
            });
            var VirtualGoodView = ExpandableListItemView.extend({
                template        : Handlebars.getTemplate("item"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CurrencyPackView = ExpandableListItemView.extend({
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CategoryView = Components.ListItemView.extend({
                template        : Handlebars.getTemplate("categoryMenuItem")
            });



            // Create an object to store all child views
            this.pageViews = {};

            // Build category menu and add it to the page views
            categories.add({name : "GET COINS", imgFilePath : this.model.get("modelAssets").currencyPacksCategory});
            var categoryMenuView = new Components.CollectionListView({
                className   : "menu items clearfix",
                collection  : categories,
                itemView    : CategoryView
            }).on("itemview:selected", function(view) { this.switch(view.model.get("name")); }, this);
            this.pageViews["menu"]  = categoryMenuView;

            // Mark this view as the active view,
            // as it is the first one visible when the store opens
            this.activeView = categoryMenuView;

            // Render all categories with their internal lists
            categories.each(function(category) {

                // Filter a collection goods associated with the current category
                var categoryGoods   = virtualGoods.filter(function(item) {return item.get("categoryId") == category.id});
                categoryGoods       = new Backbone.Collection(categoryGoods);
                var categoryName    = category.get("name");

                var view = new Components.CollectionListView({
                    className   : "items virtualGoods category " + categoryName,
                    collection  : categoryGoods,
                    itemView    : VirtualGoodView
                }).on({
                    "itemview:buy"          : function(view) { $this.wantsToBuyVirtualGoods(view.model);},
                    "itemview:equipped"     : function(view) { $this.wantsToEquipGoods(view.model);     },
                    "itemview:unequipped"   : function(view) { $this.wantsToUnequipGoods(view.model);   }
                });

                $this.pageViews[categoryName] = view;
            });


            // Build currency packs category and add it to the page views
            var currencyPacksView = new Components.CollectionListView({
                className   : "items currencyPacks category",
                collection  : currencyPacks,
                itemView    : CurrencyPackView
            }).on("itemview:buy", function(view) { $this.wantsToBuyCurrencyPacks(view.model); });
            this.pageViews["GET COINS"] = currencyPacksView;


            // Build header view
            this.header = new HeaderView().on({
                back : function() {
                    // First, collapse all list items that are open
                    _.each(this.activeView.children, function(view) {
                        if (view.expanded) view.collapse();
                    });

                    // Second, switch back to the menu
                    this.switch("menu");
                },
                quit : this.wantsToLeaveStore
            }, this);
        },
        switch : function(name) {
            this.header.state = name;
            this.activeView.$el.hide();
            this.activeView = this.pageViews[name];
            this.activeView.$el.show();
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
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 640) : (innerHeight / 960),;
        }
    });


    return {
        StoreView : StoreView
    };
});