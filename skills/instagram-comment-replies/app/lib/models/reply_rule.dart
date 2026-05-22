enum MatchType { any, all, exact }

class ReplyRule {
  final String id;
  final String name;
  final List<String> keywords;
  final MatchType matchType;
  final String? commentReply;
  final String? dmReply;
  final bool enabled;

  const ReplyRule({
    required this.id,
    required this.name,
    required this.keywords,
    required this.matchType,
    this.commentReply,
    this.dmReply,
    this.enabled = true,
  });

  bool matches(String text) {
    final lower = text.toLowerCase();
    final kws = keywords.map((k) => k.toLowerCase()).toList();
    switch (matchType) {
      case MatchType.any:
        return kws.any((k) => lower.contains(k));
      case MatchType.all:
        return kws.every((k) => lower.contains(k));
      case MatchType.exact:
        return kws.any((k) => lower.trim() == k.trim());
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'keywords': keywords,
        'matchType': matchType.name,
        'commentReply': commentReply,
        'dmReply': dmReply,
        'enabled': enabled,
      };

  factory ReplyRule.fromJson(Map<String, dynamic> json) => ReplyRule(
        id: json['id'] as String,
        name: json['name'] as String,
        keywords: List<String>.from(json['keywords'] as List),
        matchType: MatchType.values.byName(json['matchType'] as String),
        commentReply: json['commentReply'] as String?,
        dmReply: json['dmReply'] as String?,
        enabled: json['enabled'] as bool? ?? true,
      );

  ReplyRule copyWith({
    String? id,
    String? name,
    List<String>? keywords,
    MatchType? matchType,
    String? commentReply,
    String? dmReply,
    bool? enabled,
  }) =>
      ReplyRule(
        id: id ?? this.id,
        name: name ?? this.name,
        keywords: keywords ?? this.keywords,
        matchType: matchType ?? this.matchType,
        commentReply: commentReply ?? this.commentReply,
        dmReply: dmReply ?? this.dmReply,
        enabled: enabled ?? this.enabled,
      );
}
