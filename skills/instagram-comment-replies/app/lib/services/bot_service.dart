import 'dart:async';
import 'package:flutter/foundation.dart';
import 'storage_service.dart';
import 'instagram_service.dart';
import '../models/reply_rule.dart';

class ActivityLog {
  final DateTime time;
  final String message;
  final bool isError;

  ActivityLog({required this.time, required this.message, this.isError = false});
}

class BotService extends ChangeNotifier {
  StorageService _storage;

  bool _running = false;
  Timer? _timer;
  final List<ActivityLog> _log = [];
  int _totalReplies = 0;

  bool get running => _running;
  List<ActivityLog> get log => List.unmodifiable(_log);
  int get totalReplies => _totalReplies;

  BotService(this._storage);

  void updateStorage(StorageService storage) {
    _storage = storage;
  }

  void _log_(String message, {bool isError = false}) {
    _log.insert(
        0, ActivityLog(time: DateTime.now(), message: message, isError: isError));
    if (_log.length > 100) _log.removeLast();
    notifyListeners();
  }

  Future<void> start() async {
    if (_running) return;
    final settings = await _storage.loadApiSettings();
    if (settings == null) {
      _log_('No API credentials found. Go to the Settings tab first.',
          isError: true);
      return;
    }
    _running = true;
    notifyListeners();
    _log_('Bot started — checking every ${_storage.pollIntervalMinutes} min.');
    await _poll(settings);
    _timer = Timer.periodic(
      Duration(minutes: _storage.pollIntervalMinutes),
      (_) async {
        final s = await _storage.loadApiSettings();
        if (s != null) await _poll(s);
      },
    );
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _running = false;
    _log_('Bot stopped.');
    notifyListeners();
  }

  // Restart with updated interval when settings change
  Future<void> restart() async {
    if (!_running) return;
    stop();
    await start();
  }

  Future<void> _poll(ApiSettings settings) async {
    final activeRules =
        _storage.rules.where((r) => r.enabled).toList();
    if (activeRules.isEmpty) return;

    final ig = InstagramService(
      accessToken: settings.accessToken,
      accountId: settings.accountId,
    );

    try {
      final media = await ig.fetchRecentMedia(limit: 10);
      for (final post in media) {
        final comments = await ig.fetchComments(post.id);
        for (final comment in comments) {
          if (await _storage.isProcessed(comment.id)) continue;
          await _storage.markProcessed(comment.id);
          final rule = _findMatch(comment.text, activeRules);
          if (rule == null) continue;
          await _applyRule(ig, comment, rule);
        }
      }
    } catch (e) {
      _log_('Poll error: $e', isError: true);
    }
  }

  ReplyRule? _findMatch(String text, List<ReplyRule> rules) {
    for (final rule in rules) {
      if (rule.matches(text)) return rule;
    }
    return null;
  }

  Future<void> _applyRule(
    InstagramService ig,
    IgComment comment,
    ReplyRule rule,
  ) async {
    final preview = comment.text.length > 30
        ? '${comment.text.substring(0, 30)}…'
        : comment.text;
    try {
      if (rule.commentReply != null) {
        await ig.replyToComment(comment.id, rule.commentReply!);
        _totalReplies++;
        _log_('Replied to @${comment.username ?? 'user'}: "$preview"');
      }
      if (rule.dmReply != null && comment.fromId != null) {
        await ig.sendDM(comment.fromId!, rule.dmReply!);
        _log_('DM sent to @${comment.username ?? 'user'}');
      }
    } catch (e) {
      _log_('Failed on comment "$preview": $e', isError: true);
    }
  }
}
