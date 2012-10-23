define(["jquery", "backbone", "components", "handlebars", "templates"], function($, Backbone, Components, Handlebars) {

    var HeaderView = Backbone.View.extend({
        initialize : function() {
            _.bindAll(this, "switchHeader");
            this.state = "menu";
        },
        events : {
            "click .back" : function() {
                this.trigger(this.state == "menu" ? "quit" : "back");
            }
        },
        switchHeader : function(title, backImage) {
            this.$(".title-container h1").html(title);
            this.$(".back img").attr("src", backImage);
        }
    });


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "wantsToLeaveStore", "updateBalance",
                            "render", "toggleItemBackground", "switch",
                            "wantsToBuyVirtualGoods", "wantsToBuyCurrencyPacks");

            this.nativeAPI   = this.options.nativeAPI || window.SoomlaNative;
            this.theme       = this.model.get("theme");
            this.dialogModel = this.theme.noFundsModal;

            this.model.get("virtualCurrencies").on("change:balance", this.updateBalance);


            var virtualGoods    = this.model.get("virtualGoods"),
                currencyPacks   = this.model.get("currencyPacks"),
                categories      = this.model.get("categories"),
                templateHelpers = { images : this.theme.images },
                $this           = this;


            // Define view types
            var VirtualGoodView = Components.ExpandableListItemView.extend({
                template        : Handlebars.getTemplate("item"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CurrencyPackView = Components.ExpandableListItemView.extend({
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
                    "itemview:buy"          : function(view) { $this.wantsToBuyVirtualGoods(view.model); },
                    "itemview:equipped"     : function(view) { $this.wantsToEquipGoods(view.model); },
                    "itemview:unequipped"   : function(view) { $this.wantsToUnequipGoods(view.model); },
                    "itemview:expanded"     : $this.toggleItemBackground,
                    "itemview:collapsed"    : $this.toggleItemBackground
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
                back : function() { this.switch("menu"); },
                quit : this.wantsToLeaveStore
            }, this);
        },
        switch : function(name) {
            this.header.state = name;
            this.activeView.$el.hide();
            this.activeView = this.pageViews[name];
            this.activeView.$el.show();
            var title = name == "menu" ? this.theme.pages.menu.title : name,
                image = name == "menu" ? this.theme.images.quitImage : this.theme.images.backImage;
            this.header.switchHeader(title, image);
        },
        toggleItemBackground : function(view) {
            var image = this.theme.images[view.expanded ? "itemBackgroundImageExpanded" : "itemBackgroundImage"];
            view.$el.css("background-image", "url('" + image + "')");
        },
        updateBalance : function(model) {
            this.$(".balance-container label").html(model.get("balance"));
        },
        onRender : function() {
            // Append background to element
            this.$el.css("background-image", "url('" + this.theme.background + "')");

            // Set header element to bind event delegation
            this.header.setElement(this.$(".header"));

            // Render child views (items in goods store and currency store)
            var $this = this;
            _.each(this.pageViews, function(view) {
                $this.$("#pages").append(view.render().el);
            });


            // Adjust zoom to fit nicely in viewport
            // This helps cope with various viewports, i.e. mobile, tablet...
            var adjustBodySize = function() {
                var ratio = (innerWidth / innerHeight) > 1.5 ? (innerHeight / 640) : (innerWidth / 960);
                $("body").css("zoom", ratio);
            };
            $(window).resize(adjustBodySize);
            adjustBodySize();

            // TODO: Add -webkit-text-size-adjust for iOS devices
        }
    });


    return {
        StoreView : StoreView
    };
});