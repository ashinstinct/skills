import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../models/reply_rule.dart';
import 'add_rule_screen.dart';

class RulesScreen extends StatelessWidget {
  const RulesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final rules = context.watch<StorageService>().rules;

    return Scaffold(
      appBar: AppBar(title: const Text('Reply Rules')),
      body: rules.isEmpty
          ? const Center(
              child: Text(
                'No rules yet.\nTap + to add your first keyword rule.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: rules.length,
              itemBuilder: (ctx, i) => _RuleCard(rule: rules[i]),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AddRuleScreen()),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _RuleCard extends StatelessWidget {
  final ReplyRule rule;
  const _RuleCard({required this.rule});

  @override
  Widget build(BuildContext context) {
    final storage = context.read<StorageService>();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 4, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(rule.name,
                      style:
                          const TextStyle(fontWeight: FontWeight.bold)),
                ),
                Switch(
                  value: rule.enabled,
                  onChanged: (v) =>
                      storage.updateRule(rule.copyWith(enabled: v)),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => AddRuleScreen(existing: rule)),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline,
                      size: 20, color: Colors.red),
                  onPressed: () => _confirmDelete(context, storage),
                ),
              ],
            ),
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: rule.keywords
                  .map((k) => Chip(
                        label: Text(k,
                            style: const TextStyle(fontSize: 12)),
                        padding: EdgeInsets.zero,
                        labelPadding:
                            const EdgeInsets.symmetric(horizontal: 8),
                        visualDensity: VisualDensity.compact,
                      ))
                  .toList(),
            ),
            if (rule.commentReply != null) ...[
              const SizedBox(height: 6),
              _ReplyRow(
                icon: Icons.chat_bubble_outline,
                color: Colors.blue,
                text: rule.commentReply!,
              ),
            ],
            if (rule.dmReply != null) ...[
              const SizedBox(height: 4),
              _ReplyRow(
                icon: Icons.mail_outline,
                color: Colors.purple,
                text: rule.dmReply!,
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, StorageService storage) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete rule?'),
        content: Text('Delete "${rule.name}"?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              storage.deleteRule(rule.id);
              Navigator.pop(ctx);
            },
            child:
                const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class _ReplyRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String text;
  const _ReplyRow(
      {required this.icon, required this.color, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 12),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
