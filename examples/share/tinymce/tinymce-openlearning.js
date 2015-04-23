TinyMCE_OpenLearning = {
    get_settings: function(editorType, params) {
        var file_browser_callback, save_callback, image_browsing_url, context_path, cohort_path, templates, template_values, initCallback, link_browsing_url;
        var helpHTML = '<div style="padding: 80px;">';
        helpHTML += '<ul>';
        helpHTML += '<li>Exit a formatting block (e.g. container) by pressing Enter twice. Control + Enter will suppress this behaviour.</li>';
        helpHTML += '<li>Exit a "code snippet" block by pressing Control + Enter</li>';
        helpHTML += '<li>Right Click to access the editor\'s context menu</li>';
        helpHTML += '<li>Control + Right Click to access the web browser\'s context menu (e.g. to list spelling corrections)</li>';
        helpHTML += '</ul>';
        helpHTML += '</div>';

        file_browser_callback = function(field_name, url, type, win) {
            typeof(params.fileLoader) === 'function' && params.fileLoader(type, url, function(url) {
               $(win.document).find('.mce-file-upload-success').html('<strong>&#10144 Uploading...</strong>').css('visibility', 'visible');
                win.document.getElementById(field_name).value = url;
            }, function(percentage) {
               $(win.document).find('.mce-file-upload-success').html('<strong>&#10144 Uploading... ' + percentage + '</strong>')
            }, function(success, message) {
               if (success) {
                  $(win.document).find('.mce-file-upload-success').html('<strong style="color: #4a4">&#10004; Upload Complete!</strong>');
               } else {
                  if (!message) {
                     message = 'Unable to Upload File';
                  }
                  $(win.document).find('.mce-file-upload-success').html('<strong style="color: #a44">&#10008; ' + message + '</strong>');
               }
            });

            if (typeof(params.pageBrowser) === 'function') {
                params.pageBrowser(field_name, url, type, win);
            }
        };

        save_callback = function(editor) {
            if (typeof(params.saveCallback) == 'function') {
                params.saveCallback(editor, function() {
                    editor.nodeChanged();
                    editor.focus();
                });
            } else {
                alert('Save callback not implemented');
            }
        };

        image_browsing_url = params.imageBrowser;
        link_browsing_url = params.linkBrowser;
        context_path = params.contextPath;
        cohort_path = params.classPath;
        templates = params.templates;
        template_values = params.templateValues;

        initCallback = function(editor) {
            // Add double-click to images
            editor.on('DblClick', function(e) {
                if (e.target.nodeName=='IMG') {
                    if (e.target.getAttribute('data-mce-object') === 'embedly') {
                        editor.execCommand('mceEmbedly');
                    } else {
                        editor.execCommand('mceImage');
                    }
                }
            });
            params.initCallback && params.initCallback(editor);
        };

        minHeight = params.minHeight;
        
        var settings = {
            context_path: context_path, // path for ~/, e.g. Course context or Profile context
            cohort_path: cohort_path, // path for -/
            context_name: params.contextName,
            storage_id: params.storageID,
            skin: 'openlearning',
            help_html: helpHTML,
            plugins: [
                "advlist autolink lists link image charmap hr anchor",
                "searchreplace wordcount visualblocks visualchars code",
                "insertdatetime embedly nonbreaking table contextmenu directionality",
                "emoticons template paste textcolor colorpicker textpattern",
                "autoresize equation help save local_backup"
            ],
            menu : {
                edit   : {title: 'Edit'  , items: 'undo redo | cut copy paste pastetext | selectall | searchreplace | local_backup code'},
                insert : {title: 'Insert', items: 'charmap equation hr | insertdatetime nonbreaking' + (templates ? ' | template' : '')},
                table  : {title: 'Table' , items: 'inserttable tableprops deletetable | cell row column'},
                view   : {title: 'View'  , items: 'visualchars visualblocks | help'}
            },
            save_enablewhendirty: true,
            save_onsavecallback: save_callback,
            browser_spellcheck: true,
            script_url: './tinymce/tinymce.min.js',
            content_css: './tinymce/content-editing.css,//fonts.googleapis.com/css?family=Open+Sans:300%2C400%2C600%2C700',
            extended_valid_elements: "pre[*],div[*],cite[*]",
            convert_fonts_to_spans: true,
            fontsize_formats: '10px 12px 14px 18px 24px 32px 36px 48px 52px 72px',
            menubar: "edit format table insert view",
            theme: 'modern',
            toolbar: "styleselect | image link embedly | bold italic forecolor |  bullist numlist | outdent indent | alignleft aligncenter alignright alignjustify | removeformat",
            statusbar: params.hasStatusBar || false,
            end_container_on_empty_block: true,
            relative_urls: false,
            image_description: true,
            file_browser_callback: file_browser_callback,
            image_browser_url: image_browsing_url,
            link_browser_url: link_browsing_url,
            image_class_list: [
                {title: 'Auto-size', value: 'img-responsive'},
                {title: 'Bordered', value: 'img-bordered'},
                {title: 'Framed', value: 'img-framed'},
                {title: 'Rounded Corners', value: 'img-rounded'},
                {title: 'Circular', value: 'img-circle'},
                {title: 'Shadow', value: 'img-shadow'},
                {title: 'Float Left', value: 'img-floatleft'},
                {title: 'Float Right', value: 'img-floatright'},
                {title: 'Centered', value: 'img-center'}
            ],
            table_class_list: [
                {title: 'None', value: ''},
                {title: 'Smooth', value: 'table-smooth'},
                {title: 'Bordered', value: 'table-bordered'},
                {title: 'Rounded', value: 'table-rounded'},
                {title: 'Striped', value: 'table-striped'},
            ],
            link_class_list: [
                {title: 'Standard', value: ''},
                {title: 'Never Underlined', value: 'link-no-underline'},
                {title: 'Always Underlined', value: 'link-underline'}
            ],
            formats: {
                spoiler: {block: 'div', classes: 'macro-spoiler', wrapper: 1},
                container: {block: 'div', classes: 'macro-container container-border', wrapper: 1, attributes: {'data-type': 'container-border'}},
                codesnippet: {block: 'pre', classes: 'macro-codesnippet prettyprint linenums'},
                cite: {inline: 'cite'}
            },
            style_formats: [
                {
                    title: "Headings", items: [
                        {title: "Header 1", format: "h1"},
                        {title: "Header 2", format: "h2"},
                        {title: "Header 3", format: "h3"},
                        {title: "Header 4", format: "h4"},
                        {title: "Body",     format: "p"},
                    ]
                },
                {
                    title: "Inline", items: [
                        {title: "Bold", icon: "bold", format: "bold"},
                        {title: "Italic", icon: "italic", format: "italic"},
                        {title: "Underline", icon: "underline", format: "underline"},
                        {title: "Strikethrough", icon: "strikethrough", format: "strikethrough"},
                        {title: "Superscript", icon: "superscript", format: "superscript"},
                        {title: "Subscript", icon: "subscript", format: "subscript"},
                        {title: "Code", icon: "code", format: "code"},
                        {title: "Citation", format: "cite"}
                    ]
                },
                {
                    title: "Special", items: [
                        {title: "Spoiler", icon: "spoiler", format: "spoiler"},
                        {title: "Container", icon: "container", format: "container"},
                        {title: "Code Block", icon: "codesnippet", format: "codesnippet"}
                    ]
                },
                {
                    title: "Blocks", items: [
                        {title: "Paragraph", format: "p"},
                        {title: "Blockquote", format: "blockquote"},
                        {title: "Div", format: "div"},
                        {title: "Pre", format: "pre"}
                    ]
                },
            ],
            table_default_attributes: {
                width: '100%'
            },
            video_template_callback: function(data) {
                return
            },
            autoresize_min_height: minHeight + 10
        };

        if (initCallback) {
            settings.init_instance_callback = initCallback;
        }

        if (templates) {
            settings.templates = templates;
        }
        if (template_values) {
            settings.template_replace_values = template_values.replace_classes;
            settings.template_selected_content_classes = template_values.selected_content_classes;
        }
        if (editorType == 'inline') {
            settings.inline = true;
        } else if (editorType == 'mini') {
            settings.plugins = [
                "advlist autolink lists link image charmap print preview hr anchor",
                "searchreplace wordcount visualblocks visualchars code fullscreen",
                "insertdatetime embedly nonbreaking save table contextmenu directionality",
                "emoticons template paste textcolor colorpicker textpattern",
                "autoresize local_backup"
            ];
            settings.menubar = false;
            settings.statusbar = false;
            settings.toolbar = "link image embedly | bold italic";
        }

        return settings;
    },

    scroll_tinymce_toolbar: function($elt, topOffset) {
        var isFloating = false;

        var updateToolbar = function() {
            var tinymce = $elt.tinymce();
            if (!tinymce) return;

            var $container = $(tinymce.editorContainer);
            var editorTop = $container.offset().top;
            var editorBottom = editorTop + $container.height();
            var scrollTop = $(window).scrollTop() + topOffset;

            var $body = $($container.find('.mce-container-body'));
            var $menu = $body.find('.mce-menubar');
            var $toolbar = $menu.next('.mce-panel');

            var toolbarHeight = $toolbar.height() + 1;
            var menuHeight = $menu.height() + 1;
            var containerWidth = $body.width();

            $elt.data('tinymce-toolbar', $toolbar);
            $elt.data('tinymce-menu', $menu);

            if (editorTop < scrollTop && editorBottom - (menuHeight + toolbarHeight) >= scrollTop) {
                $menu.css({
                    'position': 'fixed',
                    'top': topOffset + 'px',
                    'width': containerWidth + 'px'
                });
                $toolbar.css({
                    'position': 'fixed',
                    'top': topOffset + menuHeight + 'px',
                    'border-bottom': '1px solid #eee',
                    'width': containerWidth + 'px'
                });
                $container.css({
                    'padding-top': menuHeight + toolbarHeight + 1 + 'px'
                });

                isFloating = true;
            } else if (isFloating && editorTop < scrollTop && editorBottom >= scrollTop) {
                // hysteresis prevention
            } else if (isFloating) {
                $menu.css({
                    'position': 'initial',
                    'top': '0px',
                    'width': 'auto'
                });
                $toolbar.css({
                    'position': 'initial',
                    'top': '0px',
                    'width': 'auto',
                    'border': 'none'
                });
                $container.css({
                    'padding-top': '0px'
                });

                isFloating = false;
            }
        };

        $(window).scroll(updateToolbar).scroll();

        return updateToolbar;
    }
};
