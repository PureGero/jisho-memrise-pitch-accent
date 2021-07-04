var busy = false;

function readingToHtml(reading) {
    var div = $('<div class="accented_word"/>');
    reading.map(({type, char}) => {
        var sp = $('<span/>');
        if (type!='') {
            sp.addClass(type);
        }
        sp.text(char);
        div.append(sp);
    });
    return div;
}

function isJapanese(text) {
    return text && !!text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);
}

function hasKanji(text) {
    return text && !!text.match(/[\u4e00-\u9faf\u3400-\u4dbf]/);
}

function add_pitch()
{
    var d = $.Deferred();
    var p = d.promise();

    if (busy)
    {
        return;
    }
    busy = true;

    var result = {};
    var words = [];

    $('.garden-box.presentation, .garden-box.complete').each(function() {
        if ($(this).find('.ojad').length > 0) {
            return;
        }

        var word;
        var questionWord = $(this).find('.qtext').text();
        var extraInfoWord = $(this).find('.extra-info').text();
        var answerWord = $(this).find('.typing-type-here').val();
        var multipleChoiceWord = $(this).find('.correct .val').text();
        if (hasKanji(answerWord)) {
            word = answerWord;
        } else if (hasKanji(multipleChoiceWord)) {
            word = multipleChoiceWord;
        } else if (hasKanji(questionWord)) {
            word = questionWord;
        } else if (hasKanji(extraInfoWord)) {
            word = extraInfoWord;
        } else if (isJapanese(questionWord)) {
            word = questionWord;
        } else if (isJapanese(extraInfoWord)) {
            word = extraInfoWord;
        } else {
            word = answerWord || multipleChoiceWord;
        }
        $('.primary-value').each(function() {
            if (hasKanji($(this).text()) || (!word && isJapanese($(this).text()))) {
                word = $(this).text();
            }
        });
        word = word.trim();
        words[words.length] = word;
        console.log(word);

        p = p.then(function() {
            var addAfter = $(this).find('.cnt').children().last();

            if (!addAfter[0]) {
                addAfter = $(this).children().last();
            }

            if (!result.hasOwnProperty(word))
            {
                $('<div class="ojad meaning-tags">No pitch accent information for ' + word + '</div>').insertAfter(addAfter);
                return;
            }

            addAfter = $('<div class="ojad meaning-tags">Pitch accent</div>').insertAfter(addAfter);

            for (var i in result[word])
            {
                var main = $('<div/>');
                for (let reading of result[word][i].data[0])
                {
                    main.append(readingToHtml(reading));
                }
                var obj;
                addAfter = obj = $('<div class="ojad meaning-wrapper"></div>').append($('<div class="ojad-tooltip-hover"/>').html(main)).insertAfter(addAfter);

                var table = $('<table/>');
                for (var idx in result[word][i].header)
                {
                    var tr = $('<tr/>');

                    var data = [ word ];
                    if (idx > 0)
                    {
                        data = result[word][i].data[idx-1];
                    }

                    if (data.length == 0)
                    {
                        continue;
                    }

                    tr.append($('<th/>').text(result[word][i].header[idx]))
                    td = $('<td/>');
                    for (let datum of data)
                    {
                        if (typeof(datum) == 'string') {
                            td.append($('<div/>').text(datum));
                        } else {
                            td.append(readingToHtml(datum));
                        }
                    }

                    tr.append(td)
                    table.append(tr);
                }

                obj.append($('<div class="ojad-tooltip"></div>').append(table));
            }
        }.bind(this));
    });

    p.then(function() { busy = false; });

    if (words.length) {
        chrome.runtime.sendMessage(null, {words: words}, function(obj) {
            result = obj;
            console.log(result);
            d.resolve();
        });
    } else {
        d.resolve();
    }
}

$(function() {
    add_pitch();

    var observer = new MutationObserver(function(mutations) {
        add_pitch();
    });

    observer.observe($('body')[0], { subtree:true, childList: true });
});
