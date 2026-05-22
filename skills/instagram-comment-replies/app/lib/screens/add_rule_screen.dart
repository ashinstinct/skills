import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/reply_rule.dart';
import '../services/storage_service.dart';

class AddRuleScreen extends StatefulWidget {
  final ReplyRule? existing;
  const AddRuleScreen({super.key, this.existing});

  @override
  State<AddRuleScreen> createState() => _AddRuleScreenState();
}

class _AddRuleScreenState extends State<AddRuleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _keywordsCtrl = TextEditingController();
  final _commentReplyCtrl = TextEditingController();
  final _dmReplyCtrl = TextEditingController();
  MatchType _matchType = MatchType.any;

  @override
  void initState() {
    super.initState();
    final r = widget.existing;
    if (r != null) {
      _nameCtrl.text = r.name;
      _keywordsCtrl.text = r.keywords.join(', ');
      _commentReplyCtrl.text = r.commentReply ?? '';
      _dmReplyCtrl.text = r.dmReply ?? '';
      _matchType = r.matchType;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _keywordsCtrl.dispose();
    _commentReplyCtrl.dispose();
    _dmReplyCtrl.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;

    final keywords = _keywordsCtrl.text
        .split(',')
        .map((k) => k.trim())
        .where((k) => k.isNotEmpty)
        .toList();

    final commentReply = _commentReplyCtrl.text.trim();
    final dmReply = _dmReplyCtrl.text.trim();

    final rule = ReplyRule(
      id: widget.existing?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      name: _nameCtrl.text.trim(),
      keywords: keywords,
      matchType: _matchType,
      commentReply: commentReply.isEmpty ? null : commentReply,
      dmReply: dmReply.isEmpty ? null : dmReply,
    );

    final storage = context.read<StorageService>();
    if (widget.existing != null) {
      storage.updateRule(rule);
    } else {
      storage.addRule(rule);
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Rule' : 'New Rule'),
        actions: [
          TextButton(onPressed: _save, child: const Text('Save')),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Rule name',
                border: OutlineInputBorder(),
                hintText: 'e.g. Link requests',
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _keywordsCtrl,
              decoration: const InputDecoration(
                labelText: 'Keywords (comma separated)',
                border: OutlineInputBorder(),
                hintText: 'link, where, how to get',
                helperText:
                    'Comment must contain these words to trigger this rule',
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Add at least one keyword' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<MatchType>(
              value: _matchType,
              decoration: const InputDecoration(
                labelText: 'Match type',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(
                    value: MatchType.any,
                    child: Text('Any keyword (comment contains at least one)')),
                DropdownMenuItem(
                    value: MatchType.all,
                    child: Text('All keywords (comment contains every one)')),
                DropdownMenuItem(
                    value: MatchType.exact,
                    child: Text('Exact match (comment equals keyword)')),
              ],
              onChanged: (v) => setState(() => _matchType = v!),
            ),
            const SizedBox(height: 24),
            const Text('Replies',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 4),
            const Text(
              'Fill in at least one. The public reply appears under the comment; the DM is sent privately.',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _commentReplyCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Public comment reply',
                border: OutlineInputBorder(),
                hintText: 'Check your DMs! 📩',
                prefixIcon: Icon(Icons.chat_bubble_outline),
              ),
              validator: (v) {
                if ((v == null || v.trim().isEmpty) &&
                    _dmReplyCtrl.text.trim().isEmpty) {
                  return 'Add at least a comment reply or a DM reply';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _dmReplyCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'DM reply (optional)',
                border: OutlineInputBorder(),
                hintText: "Hey! Here's the link: https://example.com",
                prefixIcon: Icon(Icons.mail_outline),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
